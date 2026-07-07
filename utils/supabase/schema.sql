-- 0. EĞER VARSA ESKİLERİ TAMAMEN SIFIRLA (Bu sıra çok önemli, birbirine bağlı oldukları için)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.log_farmer_activity cascade;
drop function if exists public.get_farmer_status cascade;
drop function if exists public.get_farmer_history cascade;
drop table if exists public.messages cascade;
drop table if exists public.activities cascade;
drop table if exists public.crops cascade;
drop table if exists public.farms cascade;
drop table if exists public.profiles cascade;

-- ==========================================
-- ANTIGRAVITY'NİN VERDİĞİ KOD BUNDAN SONRA BAŞLIYOR
-- ==========================================

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  phone text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Allow public read access to profiles" on public.profiles for select using (true);
create policy "Allow users to update their own profile" on public.profiles for update using (auth.uid() = id);

-- 2. Farms Table
create table public.farms (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  location text,
  area numeric, -- in dönüm
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.farms enable row level security;
create policy "Users can perform all actions on their own farms" on public.farms for all using (auth.uid() = user_id);

-- 3. Crops Table
create table public.crops (
  id uuid default gen_random_uuid() primary key,
  farm_id uuid references public.farms(id) on delete cascade not null,
  name text not null, -- E.g. Domates, Biber
  planting_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.crops enable row level security;
create policy "Users can perform all actions on their own crops" on public.crops for all using (
  exists (
    select 1 from public.farms
    where farms.id = crops.farm_id and farms.user_id = auth.uid()
  )
);

-- 4. Activities Table
create table public.activities (
  id uuid default gen_random_uuid() primary key,
  crop_id uuid references public.crops(id) on delete cascade not null,
  data jsonb not null, -- {activity_type, product, quantity, unit, date, etc.}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.activities enable row level security;
create policy "Users can perform all actions on their own activities" on public.activities for all using (
  exists (
    select 1 from public.crops
    join public.farms on farms.id = crops.farm_id
    where crops.id = activities.crop_id and farms.user_id = auth.uid()
  )
);

-- 5. Messages Table (WhatsApp Logs)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  phone text not null,
  raw_message text not null,
  intent text, -- activity, question, unknown
  extracted_data jsonb,
  reply_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;
create policy "Allow inserts to messages" on public.messages for insert with check (true);
create policy "Allow select to messages" on public.messages for select using (true);

-- 6. Trigger to automatically sync profiles on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Çiftçi'),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Security Definer Helper: Log Farmer Activity from WhatsApp Webhook
create or replace function public.log_farmer_activity(
  p_phone text,
  p_farm_name text,
  p_crop_name text,
  p_activity_data jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_farm_id uuid;
  v_crop_id uuid;
  v_activity_id uuid;
begin
  -- Find user by phone
  select id into v_user_id from public.profiles where phone = p_phone limit 1;
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  -- Find or create farm
  select id into v_farm_id from public.farms 
  where user_id = v_user_id and lower(name) = lower(p_farm_name) limit 1;
  
  if v_farm_id is null then
    insert into public.farms (user_id, name)
    values (v_user_id, p_farm_name)
    returning id into v_farm_id;
  end if;

  -- Find or create crop
  select id into v_crop_id from public.crops 
  where farm_id = v_farm_id and lower(name) = lower(p_crop_name) limit 1;
  
  if v_crop_id is null then
    insert into public.crops (farm_id, name)
    values (v_farm_id, p_crop_name)
    returning id into v_crop_id;
  end if;

  -- Insert activity
  insert into public.activities (crop_id, data)
  values (v_crop_id, p_activity_data)
  returning id into v_activity_id;

  return jsonb_build_object(
    'success', true,
    'farm_id', v_farm_id,
    'crop_id', v_crop_id,
    'activity_id', v_activity_id
  );
end;
$$;

-- 8. Security Definer Helper: Get Farmer Status (Farms & Crops)
create or replace function public.get_farmer_status(p_phone text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_farms jsonb;
  v_crops jsonb;
begin
  select id
  into v_user_id
  from public.profiles
  where phone = p_phone
  limit 1;

  if v_user_id is null then
    return jsonb_build_object(
      'registered', false
    );
  end if;

  select coalesce(jsonb_agg(f), '[]'::jsonb)
  into v_farms
  from (
    select
      id,
      name,
      location,
      area
    from public.farms
    where user_id = v_user_id
  ) f;

  select coalesce(jsonb_agg(c), '[]'::jsonb)
  into v_crops
  from (
    select
      c.id,
      c.name,
      c.planting_date,
      f.name as farm_name
    from public.crops c
    join public.farms f on c.farm_id = f.id
    where f.user_id = v_user_id
  ) c;

  return jsonb_build_object(
    'registered', true,
    'name', (
      select name
      from public.profiles
      where id = v_user_id
    ),
    'farms', v_farms,
    'crops', v_crops
  );
end;
$$;

-- 9. Security Definer Helper: Get Farmer History
create or replace function public.get_farmer_history(p_phone text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_history jsonb;
begin
  select id
  into v_user_id
  from public.profiles
  where phone = p_phone
  limit 1;

  if v_user_id is null then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(t), '[]'::jsonb)
  into v_history
  from (
    select
      f.name as farm_name,
      c.name as crop_name,
      a.data as activity_data,
      a.created_at
    from public.activities a
    join public.crops c on a.crop_id = c.id
    join public.farms f on c.farm_id = f.id
    where f.user_id = v_user_id
    order by a.created_at desc
    limit 10
  ) t;

  return v_history;
end;
$$;
-- ==========================================
-- 10. Conversation State
-- ==========================================

create table public.conversation_state (

    id uuid default gen_random_uuid() primary key,

    phone text not null unique,

    intent text not null,

    status text not null,

    pending_data jsonb not null default '{}'::jsonb,

    last_message_at timestamptz default now(),

    created_at timestamptz default now(),

    updated_at timestamptz default now()

);

alter table public.conversation_state
enable row level security;

create policy "Allow service role full access"
on public.conversation_state
for all
using (true)
with check (true);