const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('src/app/(dashboard)/transform');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('model: "Gemini Pro"')) {
    content = content.replace(/model: "Gemini Pro"/g, 'model: typeof window !== "undefined" ? localStorage.getItem("act_selected_model") || "Gemini Pro" : "Gemini Pro"');
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Updated', file);
  }
});

console.log('Total files updated:', changedCount);
