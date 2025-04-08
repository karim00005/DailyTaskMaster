import { up as createBalanceHistory } from './migrations/004_create_balance_history';

async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    // Run migrations in sequence
    await createBalanceHistory();
    
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
