const fs = require('fs');

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;
  
  const res = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${apiKey}`, {
    method: 'OPTIONS',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'x-goog-upload-command, x-goog-upload-offset',
      'Origin': 'http://localhost:3000'
    }
  });
  
  console.log("Status:", res.status);
  console.log("Headers:", Array.from(res.headers.entries()));
}
test();
