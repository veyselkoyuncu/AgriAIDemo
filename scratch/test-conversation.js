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

const TEST_PHONE = '905522617090'; // Verified test phone number

function makePayload(text, msgId) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "12345",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "16315551181",
                phone_number_id: "1187383141129399"
              },
              contacts: [
                {
                  profile: { name: "Test Farmer" },
                  wa_id: TEST_PHONE
                }
              ],
              messages: [
                {
                  from: TEST_PHONE,
                  id: msgId || `wamid.test_${Date.now()}_${Math.random()}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  text: { body: text },
                  type: "text"
                }
              ]
            }
          }
        ]
      }
    ]
  };
}

async function sendWebhook(text, msgId) {
  console.log(`\n--- Farmer sends: "${text}" ---`);
  const response = await fetch('http://localhost:3000/api/webhooks/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(makePayload(text, msgId))
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`HTTP Error: ${response.status} - ${errorText}`);
    return null;
  }
  
  const data = await response.json();
  console.log('Webhook Response:', JSON.stringify(data, null, 2));
  return data;
}

async function getDBState() {
  const { data, error } = await supabase
    .from('conversation_state')
    .select('*')
    .eq('phone', TEST_PHONE)
    .maybeSingle();
  if (error) console.error('Error fetching conversation state from DB:', error.message);
  return data;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('Clearing conversation state for', TEST_PHONE);
  await supabase.from('conversation_state').delete().eq('phone', TEST_PHONE);
  
  // 1. Initial message - Start fertilization activity
  await sendWebhook('Bugün gübre attım');
  let state = await getDBState();
  console.log('Current DB state pending_data:', JSON.stringify(state?.pending_data, null, 2));
  
  // Wait to avoid rate limits
  console.log('Sleeping 15 seconds to avoid Gemini rate limit...');
  await sleep(15000);

  // 2. Interruption - Soru sorma
  await sendWebhook('Domatesler ne kadar gübre ister?');
  state = await getDBState();
  console.log('Conversation state (should still exist!):', state ? 'EXISTS' : 'NOT FOUND');
  console.log('Current DB state pending_data (should be unchanged):', JSON.stringify(state?.pending_data, null, 2));

  // Wait to avoid rate limits
  console.log('Sleeping 15 seconds to avoid Gemini rate limit...');
  await sleep(15000);

  // 3. Fill field - Farm
  await sendWebhook('Dere tarlası');
  state = await getDBState();
  console.log('Current DB state pending_data (should have farm):', JSON.stringify(state?.pending_data, null, 2));

  // Wait to avoid rate limits
  console.log('Sleeping 15 seconds to avoid Gemini rate limit...');
  await sleep(15000);

  // 4. Correction - Change farm
  await sendWebhook('Hayır, Çayır tarlası');
  state = await getDBState();
  console.log('Current DB state pending_data (farm should be corrected to Çayır tarlası):', JSON.stringify(state?.pending_data, null, 2));

  // Wait to avoid rate limits
  console.log('Sleeping 15 seconds to avoid Gemini rate limit...');
  await sleep(15000);

  // 5. Fill field - Crop
  await sendWebhook('Domates');
  state = await getDBState();
  console.log('Current DB state pending_data (should have crop):', JSON.stringify(state?.pending_data, null, 2));

  // Wait to avoid rate limits
  console.log('Sleeping 15 seconds to avoid Gemini rate limit...');
  await sleep(15000);

  // 6. Unknown interruption - emoji
  await sendWebhook('Tamamdır 👍');
  state = await getDBState();
  console.log('Conversation state (should still exist!):', state ? 'EXISTS' : 'NOT FOUND');

  // Wait to avoid rate limits
  console.log('Sleeping 15 seconds to avoid Gemini rate limit...');
  await sleep(15000);

  // 7. Fill field - Product
  await sendWebhook('Üre gübresi');
  state = await getDBState();
  console.log('Current DB state pending_data (should have product):', JSON.stringify(state?.pending_data, null, 2));

  // Wait to avoid rate limits
  console.log('Sleeping 15 seconds to avoid Gemini rate limit...');
  await sleep(15000);

  // 8. Fill field - Quantity (Final field!)
  await sendWebhook('50 kg');
  state = await getDBState();
  console.log('Conversation state (should be DELETED/null since complete):', state);
}

// Wait for dev server to start
setTimeout(() => {
  main().catch(err => console.error('Test script crashed:', err));
}, 1000);
