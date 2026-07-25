const fs = require('fs');
const path = 'src/app/api/teacher/classes/route.ts';

let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

let newLines = [];
let inMembers = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('members: {') && lines[i-1] && lines[i-1].includes('_count')) {
    inMembers = true;
    newLines.push(lines[i]);
  } else if (inMembers && lines[i].includes('where: { status: "APPROVED" },')) {
    inMembers = false; // we skipped it
  } else {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync(path, newLines.join('\r\n'));
console.log('Fixed classes API properly');
