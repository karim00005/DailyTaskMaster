import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.PG_POOL_MAX || '20'),
  idleTimeoutMillis: parseInt(process.env.PG_POOL_IDLE_TIMEOUT || '10000'),
  connectionTimeoutMillis: 30000, // Increase timeout
  ssl: {
    rejectUnauthorized: false // Allow self-signed certs
  },
  maxUses: 7500, // Add max uses per connection
  allowExitOnIdle: true
});

// Setup connection management
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  client.release(true);
});

pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('acquire', () => {
  console.log('Connection acquired from pool');
});

export const db = drizzle({ client: pool, schema });

// Add keepalive query with retry
const keepAlive = async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('Keepalive query failed, retrying in 5s:', err);
    setTimeout(keepAlive, 5000);
  }
};

setInterval(keepAlive, 30000);
