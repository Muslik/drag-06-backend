import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/infrastructure/database/drizzle/schema.ts',
  out: 'database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DATABASE_HOST ?? '',
    port: Number.parseInt(process.env.DATABASE_PORT || '', 10),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME ?? '',
  },
  verbose: true,
  strict: true,
});
