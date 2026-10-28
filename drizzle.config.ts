import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load .env.local for local CLI usage
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error('DATABASE_URL_UNPOOLED is missing from .env.local');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED,
  },
});