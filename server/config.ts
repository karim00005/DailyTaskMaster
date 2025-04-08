import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
config({ path: join(process.cwd(), '.env') });

export const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in .env file');
}
