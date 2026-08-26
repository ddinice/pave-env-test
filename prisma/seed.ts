import { db } from "../lib/db";
import { documentedCredentials } from "./seed-data";
import { seedDesignVariables } from "./seed-design-variables";

async function main() {
  const users = await Promise.all(
    documentedCredentials.map(({ email, name, passwordHash, role }) =>
      db.user.upsert({
        where: { email },
        update: { name, role, passwordHash },
        create: { email, name, role, passwordHash },
      }),
    ),
  );
  const analyst = users.find((user) => user.role === "ANALYST");

  if (!analyst) throw new Error("Seed analyst was not created.");

  await seedDesignVariables(db, analyst.id);

  const count = await db.designVariable.count();
  console.log(`Seeded ${documentedCredentials.length} users and ${count} design variables.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
