import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pkg from 'pg';

const { Client } = pkg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    console.log('Applying migrations...');

    await client.connect();
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: 'database/migrations', migrationsSchema: 'public' });

    console.log('Migrations applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);

    process.exit(1);
  } finally {
    await client.end();
  }
})();
