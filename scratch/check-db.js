const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('Testing schema.sql columns (pending_data, status)...');
  const test1 = await supabase
    .from('conversation_state')
    .insert({
      phone: 'test_temp_1',
      intent: 'activity',
      status: 'active',
      pending_data: { test: true }
    })
    .select();
  
  if (test1.error) {
    console.error('test1 (schema.sql columns) failed:', test1.error.message);
  } else {
    console.log('test1 (schema.sql columns) succeeded!', test1.data);
    // Cleanup
    await supabase.from('conversation_state').delete().eq('phone', 'test_temp_1');
  }

  console.log('Testing user description columns (collected_data, missing_fields)...');
  const test2 = await supabase
    .from('conversation_state')
    .insert({
      phone: 'test_temp_2',
      intent: 'activity',
      collected_data: { test: true },
      missing_fields: ['crop_name'],
      last_message: 'hello'
    })
    .select();

  if (test2.error) {
    console.error('test2 (user columns) failed:', test2.error.message);
  } else {
    console.log('test2 (user columns) succeeded!', test2.data);
    // Cleanup
    await supabase.from('conversation_state').delete().eq('phone', 'test_temp_2');
  }
}

checkColumns();
