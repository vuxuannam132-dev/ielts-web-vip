const fs = require('fs');
const path = require('path');

const routes = [
  'admin/analytics/route.ts',
  'admin/practice/route.ts',
  'admin/users/route.ts',
  'teacher/classes/route.ts',
  'teacher/assignments/route.ts',
  'teacher/members/route.ts',
  'student/classes/route.ts',
  'user/stats/route.ts',
];

for (const route of routes) {
  const p = path.join('src', 'app', 'api', route);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    if (!content.includes('export const dynamic = ')) {
      content = content.replace('export async function GET', "export const dynamic = 'force-dynamic'\n\nexport async function GET");
      fs.writeFileSync(p, content);
      console.log('Fixed', route);
    }
  }
}
