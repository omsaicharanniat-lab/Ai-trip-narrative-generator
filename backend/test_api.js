require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODELS_TO_TRY = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
];

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Testing API Key:', apiKey ? apiKey.substring(0, 12) + '...' : 'NOT SET');

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of MODELS_TO_TRY) {
    try {
      process.stdout.write(`  Trying ${modelName}... `);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Reply with one word: Hello');
      console.log(`✅  "${result.response.text().trim()}"`);
      console.log(`\n🎉 Working model: ${modelName}`);
      return modelName;
    } catch (err) {
      const code = err.message.includes('404') ? '404' : err.message.includes('400') ? '400' : '?';
      console.log(`❌ (${code})`);
    }
  }
  console.log('\n❌ No working model found with this key.');
}

test().catch(err => console.error('Fatal:', err.message));
