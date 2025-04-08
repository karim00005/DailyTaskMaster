import { pgTable, text, serial, integer, boolean, timestamp, numeric, foreignKey, uniqueIndex, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  invoices: many(invoices),
  transactions: many(transactions),
}));

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientType: text("client_type").default("عميل"),
  accountType: text("account_type").notNull().default("مدين"),
  code: text("code"),
  taxId: text("tax_id"),
  balance: numeric("balance").notNull().default("0"),
  address: text("address"),
  city: text("city"),
  phone: text("phone"),
  mobile: text("mobile"),
  email: text("email"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  invoices: many(invoices),
  transactions: many(transactions),
}));

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  barcode: text("barcode"),
  category: text("category"),
  description: text("description"),
  unit: text("unit").notNull().default("طن"),
  buyPrice: numeric("buy_price").notNull().default("0"),
  sellPrice: numeric("sell_price").notNull().default("0"),
  minStock: integer("min_stock").default(0),
  currentStock: numeric("current_stock").notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productsRelations = relations(products, ({ many }) => ({
  invoiceItems: many(invoiceItems),
}));

// Warehouses table
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  invoiceType: text("invoice_type").notNull(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "restrict" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "restrict" }),
  date: date("date").notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull().default("cash"),
  subTotal: numeric("sub_total").notNull().default("0"),
  discount: numeric("discount").notNull().default("0"),
  tax: numeric("tax").notNull().default("0"),
  total: numeric("total").notNull().default("0"),
  paid: numeric("paid").notNull().default("0"),
  due: numeric("due").notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  items: many(invoiceItems),
  transactions: many(transactions),
}));

// Invoice Items table
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "restrict" }),
  quantity: numeric("quantity").notNull().default("1"),
  price: numeric("price").notNull().default("0"),
  discount: numeric("discount").notNull().default("0"),
  tax: numeric("tax").notNull().default("0"),
  total: numeric("total").notNull().default("0"),
});

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionNumber: text("transaction_number").notNull().unique(),
  transactionType: text("transaction_type").notNull(),
  type: text("type").notNull().default("صرف"), // صرف أو قبض
  clientId: integer("client_id").references(() => clients.id, { onDelete: "restrict" }),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "restrict" }),
  date: date("date").notNull(),
  amount: numeric("amount").notNull().default("0"),
  paymentMethod: text("payment_method").notNull().default("cash"),
  referenceNumber: text("reference_number"),
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  client: one(clients, {
    fields: [transactions.clientId],
    references: [clients.id],
  }),
  invoice: one(invoices, {
    fields: [transactions.invoiceId],
    references: [invoices.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

// Balance History table
export const balanceHistory = pgTable("balance_history", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  previousBalance: numeric("previous_balance").notNull().default("0"),
  amount: numeric("amount").notNull().default("0"),
  newBalance: numeric("new_balance").notNull().default("0"),
  type: text("type").notNull(), // credit or debit
  description: text("description"),
  date: timestamp("date").defaultNow(),
});

export const balanceHistoryRelations = relations(balanceHistory, ({ one }) => ({
  client: one(clients, {
    fields: [balanceHistory.clientId],
    references: [clients.id],
  }),
  transaction: one(transactions, {
    fields: [balanceHistory.transactionId],
    references: [transactions.id],
  }),
}));

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  companyAddress: text("company_address"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  companyWebsite: text("company_website"),
  taxId: text("tax_id"),
  taxNumber: text("tax_number"),
  logo: text("logo"),
  currency: text("currency").notNull().default("EGP"),
  defaultCurrency: text("default_currency").notNull().default("EGP"),
  taxPercent: numeric("tax_percent").notNull().default("0"),
  invoiceNotes: text("invoice_notes"),
  receiptNotes: text("receipt_notes"),
  defaultInvoiceStatus: text("default_invoice_status").notNull().default("pending"),
  defaultPaymentMethod: text("default_payment_method").notNull().default("cash"),
  defaultLanguage: text("default_language").notNull().default("ar"),
  rtlMode: boolean("rtl_mode").notNull().default(true),
  darkMode: boolean("dark_mode").notNull().default(false),
  enableNotifications: boolean("enable_notifications").notNull().default(true),
  autoBackup: boolean("auto_backup").notNull().default(false),
});

// Schema for inserts
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export const insertBalanceHistorySchema = createInsertSchema(balanceHistory).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

export type BalanceHistory = typeof balanceHistory.$inferSelect;
export type InsertBalanceHistory = z.infer<typeof insertBalanceHistorySchema>;
