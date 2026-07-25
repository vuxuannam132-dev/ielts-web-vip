const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Sync 1: If role is TEACHER, tier must be TEACHER
  const r1 = await prisma.user.updateMany({
    where: {
      role: 'TEACHER',
      tier: { not: 'TEACHER' }
    },
    data: {
      tier: 'TEACHER'
    }
  });

  // Sync 2: If tier is TEACHER, role must be TEACHER
  const r2 = await prisma.user.updateMany({
    where: {
      tier: 'TEACHER',
      role: { not: 'TEACHER' }
    },
    data: {
      role: 'TEACHER'
    }
  });

  // Sync 3: If user is somehow FREE but they have TEACHER role? Addressed above.
  
  console.log(`Sync 1 (Role -> Tier): Updated ${r1.count} users.`);
  console.log(`Sync 2 (Tier -> Role): Updated ${r2.count} users.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
