const fs = require('fs');

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No key");
    return;
  }
  
  // 1. Start session
  const res = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${apiKey}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': '10',
      'X-Goog-Upload-Header-Content-Type': 'text/plain',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ file: { displayName: "test.txt" } })
  });
  
  const uploadUrl = res.headers.get('x-goog-upload-url');
  console.log("Upload URL:", uploadUrl);
  
  if (uploadUrl) {
    // 2. Upload without key?
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Command': 'upload, finalize',
        'X-Goog-Upload-Offset': '0'
      },
      body: "helloworld"
    });
    
    console.log("Upload Res:", uploadRes.status);
    const data = await uploadRes.json();
    console.log("Data:", data);
  }
}

test();
