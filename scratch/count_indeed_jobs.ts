import { prisma } from '../lib/db';

async function main() {
  const jobs = await prisma.discoveredJob.findMany({
    where: { sourcePortal: 'Indeed' }
  });
  console.log(`Total Indeed jobs in DB: ${jobs.length}`);
  for (const job of jobs) {
    console.log(`- "${job.title}" at "${job.company}" | URL: ${job.url}`);
  }
}

main();
