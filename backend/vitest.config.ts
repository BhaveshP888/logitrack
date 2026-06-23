import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config();
export default defineConfig({
  test: {
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/logitrack_test?schema=public',
      VITEST: 'true',
    },
    fileParallelism: false,
  },
});
