const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      role: 'TEACHER',
      tier: 'FREE' // Or just any tier that is not TEACHER if you prefer, but FREE is fine
    },
    data: {
      tier: 'TEACHER'
    }
  });
  console.log(`Updated ${result.count} teachers to TEACHER tier.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
