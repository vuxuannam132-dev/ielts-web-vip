const fs = require('fs');
const path = 'src/app/api/teacher/classes/route.ts';

let content = fs.readFileSync(path, 'utf8');
content = content.replace('                take: 50,\r\n', '');
content = content.replace('                take: 50,\n', '');

fs.writeFileSync(path, content);
console.log('Fixed classes API take limit');
