const fs = require('fs');
const path = 'c:/Users/OEM/.gemini/antigravity/playground/sentience-ai/src/components/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\\"/g, '"').replace(/\\'/g, "'");
fs.writeFileSync(path, content);
console.log('Fixed escaped quotes in LandingPage.tsx');
