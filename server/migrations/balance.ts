import { sql } from "drizzle-orm";
import { db } from "../db";

export async function createBalanceHistoryTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS balance_history (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      previous_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
      amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      new_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
      type TEXT NOT NULL,
      description TEXT,
      date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT balance_history_client_fk FOREIGN KEY (client_id) REFERENCES clients(id),
      CONSTRAINT balance_history_transaction_fk FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_balance_history_client ON balance_history(client_id);
    CREATE INDEX IF NOT EXISTS idx_balance_history_date ON balance_history(date);
  `.execute();
}
