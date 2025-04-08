import { 
  users, clients, products, warehouses, invoices, invoiceItems, transactions, settings, balanceHistory,
  type User, type InsertUser, 
  type Client, type InsertClient,
  type Product, type InsertProduct,
  type Warehouse, type InsertWarehouse,
  type Invoice, type InsertInvoice,
  type InvoiceItem, type InsertInvoiceItem,
  type Transaction, type InsertTransaction,
  type Settings, type InsertSettings,
  type BalanceHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { createHash } from "crypto";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientByName(name: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  getActiveClients(): Promise<Client[]>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductByName(name: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  
  // Warehouse operations
  getWarehouse(id: number): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  getAllWarehouses(): Promise<Warehouse[]>;
  getDefaultWarehouse(): Promise<Warehouse | undefined>;
  
  // Invoice operations
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceWithItems(id: number): Promise<{invoice: Invoice, items: InvoiceItem[]} | undefined>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  getAllInvoices(): Promise<Invoice[]>;
  getInvoicesByClient(clientId: number): Promise<Invoice[]>;
  getInvoicesByType(type: string): Promise<Invoice[]>;
  getInvoicesByDate(startDate: Date, endDate: Date): Promise<Invoice[]>;
  
  // Invoice Item operations
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<boolean>;
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionsByClient(clientId: number): Promise<Transaction[]>;
  getTransactionsByType(type: string): Promise<Transaction[]>;
  getTransactionsByDate(startDate: Date, endDate: Date): Promise<Transaction[]>;
  
  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
  
  // Statistics
  getDashboardStats(): Promise<any>;
  
  // Balance methods
  getClientBalance(clientId: number): Promise<string>;
  getBalanceHistory(clientId: number): Promise<BalanceHistory[]>;
  updateClientBalance(
    clientId: number, 
    amount: number, 
    type: string, 
    transactionId: number,
    description: string
  ): Promise<Client>;

  // Session store
  sessionStore: session.Store;
}

// Helper to hash passwords
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = hashPassword(insertUser.password);
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    if (userUpdate.password) {
      userUpdate.password = hashPassword(userUpdate.password);
    }
    
    const [user] = await db.update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientByName(name: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.name, name));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [createdClient] = await db.insert(clients).values(client).returning();
    return createdClient;
  }

  async updateClient(id: number, clientUpdate: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db.update(clients)
      .set(clientUpdate)
      .where(eq(clients.id, id))
      .returning();
    
    return client;
  }

  async getAllClients(): Promise<Client[]> {
    return db.select().from(clients);
  }

  async getActiveClients(): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.isActive, true));
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductByName(name: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.name, name));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [createdProduct] = await db.insert(products).values(product).returning();
    return createdProduct;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set(productUpdate)
      .where(eq(products.id, id))
      .returning();
    
    return product;
  }

  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products);
  }

  async getActiveProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.isActive, true));
  }

  // Warehouse methods
  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const [createdWarehouse] = await db.insert(warehouses).values(warehouse).returning();
    return createdWarehouse;
  }

  async updateWarehouse(id: number, warehouseUpdate: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const [warehouse] = await db.update(warehouses)
      .set(warehouseUpdate)
      .where(eq(warehouses.id, id))
      .returning();
    
    return warehouse;
  }

  async getAllWarehouses(): Promise<Warehouse[]> {
    return db.select().from(warehouses);
  }

  async getDefaultWarehouse(): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.isDefault, true));
    return warehouse;
  }

  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceWithItems(id: number): Promise<{invoice: Invoice, items: InvoiceItem[]} | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    
    if (!invoice) {
      return undefined;
    }
    
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    
    return { invoice, items };
  }

  async createInvoice(invoiceData: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const count = await db.select({ count: sql<number>`count(*)` }).from(invoices);
      const nextNum = (count[0].count + 1).toString().padStart(4, '0');
      
      invoiceData.invoiceNumber = `INV-${year}${month}-${nextNum}`;
    }
    
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create the invoice
      const [invoice] = await tx.insert(invoices).values(invoiceData).returning();
      
      // Create all invoice items and update product stock
      if (items.length > 0) {
        // Insert invoice items
        await tx.insert(invoiceItems).values(
          items.map(item => ({
            ...item,
            invoiceId: invoice.id
          }))
        );
        
        // Update product stock for each item
        for (const item of items) {
          if (item.productId) {
            // Get the current product
            const [product] = await tx.select()
              .from(products)
              .where(eq(products.id, item.productId));
              
            if (product) {
              let newStock: string;
              
              // For sales invoices, decrease stock
              if (invoiceData.invoiceType === 'فاتورة بيع') {
                // Convert to numbers for calculation then back to string
                const currentStock = parseFloat(product.currentStock);
                // Ensure quantity exists and has a valid value
                const itemQuantity = item.quantity ? parseFloat(item.quantity.toString()) : 0;
                if (itemQuantity <= 0) continue; // Skip if no valid quantity
                newStock = (currentStock - itemQuantity).toString();
              } 
              // For purchase invoices, increase stock
              else if (invoiceData.invoiceType === 'فاتورة شراء') {
                // Convert to numbers for calculation then back to string
                const currentStock = parseFloat(product.currentStock);
                const itemQuantity = item.quantity ? parseFloat(item.quantity.toString()) : 0;
                if (itemQuantity <= 0) continue; // Skip if no valid quantity
                newStock = (currentStock + itemQuantity).toString();
              }
              // For other invoice types, don't change stock
              else {
                continue;
              }
              
              // Update the product stock
              await tx.update(products)
                .set({ currentStock: newStock })
                .where(eq(products.id, item.productId));
            }
          }
        }
      }
      
      return invoice;
    });
  }

  async updateInvoice(id: number, invoiceUpdate: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db.update(invoices)
      .set(invoiceUpdate)
      .where(eq(invoices.id, id))
      .returning();
    
    return invoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    try {
      return await db.transaction(async (tx) => {
        // First get the invoice with all items
        const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, id));
        if (!invoice) {
          return false;
        }
  
        // Get all invoice items
        const items = await tx.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
        
        // Update product stock for each item
        for (const item of items) {
          if (item.productId) {
            const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
            if (product) {
              const itemQuantity = parseFloat(item.quantity);
              const currentStock = parseFloat(product.currentStock);
              let newStock: number;
  
              // Reverse the stock changes based on invoice type
              if (invoice.invoiceType === 'فاتورة بيع') {
                newStock = currentStock + itemQuantity; // Return items to stock
              } else if (invoice.invoiceType === 'فاتورة شراء') {
                newStock = currentStock - itemQuantity; // Remove items from stock
              } else {
                continue;
              }
  
              // Update product stock
              await tx.update(products)
                .set({ currentStock: newStock.toString() })
                .where(eq(products.id, item.productId));
            }
          }
        }
  
        // Delete invoice items first
        await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
        
        // Finally delete the invoice
        const result = await tx.delete(invoices).where(eq(invoices.id, id)).returning();
        
        return result.length > 0;
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices).orderBy(desc(invoices.date));
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return db.select()
      .from(invoices)
      .where(eq(invoices.clientId, clientId))
      .orderBy(desc(invoices.date));
  }

  async getInvoicesByType(type: string): Promise<Invoice[]> {
    return db.select()
      .from(invoices)
      .where(eq(invoices.invoiceType, type))
      .orderBy(desc(invoices.date));
  }

  async getInvoicesByDate(startDate: Date, endDate: Date): Promise<Invoice[]> {
    return db.select()
      .from(invoices)
      .where(
        and(
          sql`${invoices.date} >= ${startDate}`,
          sql`${invoices.date} <= ${endDate}`
        )
      )
      .orderBy(desc(invoices.date));
  }

  // Invoice Item methods
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [createdItem] = await db.insert(invoiceItems).values(item).returning();
    return createdItem;
  }

  async updateInvoiceItem(id: number, itemUpdate: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    return await db.transaction(async (tx) => {
      // Get the original item to calculate stock difference
      const [originalItem] = await tx.select()
        .from(invoiceItems)
        .where(eq(invoiceItems.id, id));
      
      if (!originalItem) {
        return undefined;
      }
      
      // Update the invoice item
      const [updatedItem] = await tx.update(invoiceItems)
        .set(itemUpdate)
        .where(eq(invoiceItems.id, id))
        .returning();
      
      // If product ID is the same and quantity is being updated
      if (originalItem.productId && itemUpdate.quantity !== undefined && 
          (!itemUpdate.productId || itemUpdate.productId === originalItem.productId)) {
        
        // Get the product
        const [product] = await tx.select()
          .from(products)
          .where(eq(products.id, originalItem.productId));
        
        if (product) {
          // Get the invoice to determine if it's a sale or purchase
          if (!originalItem.invoiceId) {
            return updatedItem;
          }
          const [invoice] = await tx.select()
            .from(invoices)
            .where(eq(invoices.id, originalItem.invoiceId));
          
          if (invoice) {
            // Calculate the difference in quantity
            const originalQuantity = parseFloat(originalItem.quantity.toString());
            const newQuantity = parseFloat(itemUpdate.quantity.toString());
            const quantityDifference = newQuantity - originalQuantity;
            
            // Skip if no actual change
            if (quantityDifference === 0) {
              return updatedItem;
            }
            
            const currentStock = parseFloat(product.currentStock);
            let newStock: number;
            
            // For sales, decrease stock (increase if quantity is reduced)
            if (invoice.invoiceType === 'فاتورة بيع') {
              newStock = currentStock - quantityDifference;
            } 
            // For purchases, increase stock (decrease if quantity is reduced)
            else if (invoice.invoiceType === 'فاتورة شراء') {
              newStock = currentStock + quantityDifference;
            }
            // For other invoice types, don't change stock
            else {
              return updatedItem;
            }
            
            // Update the product stock
            await tx.update(products)
              .set({ currentStock: newStock.toString() })
              .where(eq(products.id, originalItem.productId));
          }
        }
      }
      
      return updatedItem;
    });
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the item to be deleted
      const [item] = await tx.select()
        .from(invoiceItems)
        .where(eq(invoiceItems.id, id));
      
      if (!item || !item.productId) {
        // Nothing to update, just delete and return
        const result = await tx.delete(invoiceItems).where(eq(invoiceItems.id, id)).returning();
        return result.length > 0;
      }
      
      // Get the invoice to determine if it's a sale or purchase
      const [invoice] = await tx.select()
        .from(invoices)
        .where(eq(invoices.id, item.invoiceId));
      
      if (!invoice) {
        // Invoice not found, just delete the item
        const result = await tx.delete(invoiceItems).where(eq(invoiceItems.id, id)).returning();
        return result.length > 0;
      }
      
      // Get the product
      const [product] = await tx.select()
        .from(products)
        .where(eq(products.id, item.productId));
      
      if (product) {
        const itemQuantity = parseFloat(item.quantity.toString());
        const currentStock = parseFloat(product.currentStock);
        let newStock: number;
        
        // For sales, add back the quantity (reverse the deduction)
        if (invoice.invoiceType === 'فاتورة بيع') {
          newStock = currentStock + itemQuantity;
        } 
        // For purchases, subtract the quantity (reverse the addition)
        else if (invoice.invoiceType === 'فاتورة شراء') {
          newStock = currentStock - itemQuantity;
        }
        // For other invoice types, don't change stock
        else {
          const result = await tx.delete(invoiceItems).where(eq(invoiceItems.id, id)).returning();
          return result.length > 0;
        }
        
        // Update the product stock
        await tx.update(products)
          .set({ currentStock: newStock.toString() })
          .where(eq(products.id, item.productId));
      }
      
      // Finally delete the item
      const result = await tx.delete(invoiceItems).where(eq(invoiceItems.id, id)).returning();
      return result.length > 0;
    });
  }

  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select({
      id: transactions.id,
      transactionNumber: transactions.transactionNumber,
      type: transactions.type,
      transactionType: transactions.transactionType,
      clientId: transactions.clientId,
      invoiceId: transactions.invoiceId,
      userId: transactions.userId,
      date: transactions.date,
      amount: transactions.amount,
      paymentMethod: transactions.paymentMethod,
      referenceNumber: transactions.referenceNumber,
      description: transactions.description,
      notes: transactions.notes,
      clientName: clients.name
    })
    .from(transactions)
    .leftJoin(clients, eq(transactions.clientId, clients.id))
    .where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    try {
      // Generate number first
      if (!transactionData.transactionNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const [{count}] = await db.select({
          count: sql<number>`count(*)`
        }).from(transactions);
        transactionData.transactionNumber = `TRX-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
      }

      // Insert transaction
      const [transaction] = await db.insert(transactions)
        .values(transactionData)
        .returning();

      // Handle balance updates if needed
      if (transaction.clientId) {
        const [currentBalance] = await db
          .select({ newBalance: balanceHistory.newBalance })
          .from(balanceHistory)
          .where(eq(balanceHistory.clientId, transaction.clientId))
          .orderBy(desc(balanceHistory.date))
          .limit(1);

        const previousBalance = parseFloat(currentBalance?.newBalance || "0");
        const amount = parseFloat(transaction.amount.toString());
        const newBalance = transaction.type === "income" 
          ? previousBalance + amount 
          : previousBalance - amount;

        // Create balance history
        await db.insert(balanceHistory).values({
          clientId: transaction.clientId,
          transactionId: transaction.id,
          previousBalance: previousBalance.toString(),
          amount: transaction.amount.toString(),
          newBalance: newBalance.toString(),
          type: transaction.type === "income" ? "credit" : "debit",
          description: transaction.description || ""
        });

        // Update client balance
        await db.update(clients)
          .set({ balance: newBalance.toString() })
          .where(eq(clients.id, transaction.clientId));
      }

      return transaction;

    } catch (error) {
      console.error("Transaction creation error:", error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  async updateTransaction(id: number, transactionUpdate: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [transaction] = await db.update(transactions)
      .set(transactionUpdate)
      .where(eq(transactions.id, id))
      .returning();
    
    return transaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id)).returning();
    return result.length > 0;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return db.select({
      id: transactions.id,
      transactionNumber: transactions.transactionNumber,
      type: transactions.type,
      transactionType: transactions.transactionType,
      clientId: transactions.clientId,
      invoiceId: transactions.invoiceId,
      userId: transactions.userId,
      date: transactions.date,
      amount: transactions.amount,
      paymentMethod: transactions.paymentMethod,
      referenceNumber: transactions.referenceNumber,
      description: transactions.description,
      notes: transactions.notes,
      clientName: clients.name
    })
    .from(transactions)
    .leftJoin(clients, eq(transactions.clientId, clients.id))
    .orderBy(desc(transactions.date));
  }

  async getTransactionsByClient(clientId: number): Promise<Transaction[]> {
    return db.select({
      id: transactions.id,
      transactionNumber: transactions.transactionNumber,
      type: transactions.type,
      transactionType: transactions.transactionType,
      clientId: transactions.clientId,
      invoiceId: transactions.invoiceId,
      userId: transactions.userId,
      date: transactions.date,
      amount: transactions.amount,
      paymentMethod: transactions.paymentMethod,
      referenceNumber: transactions.referenceNumber,
      description: transactions.description,
      notes: transactions.notes,
      clientName: clients.name
    })
    .from(transactions)
    .leftJoin(clients, eq(transactions.clientId, clients.id))
    .where(eq(transactions.clientId, clientId))
    .orderBy(desc(transactions.date));
  }

  async getTransactionsByType(type: string): Promise<Transaction[]> {
    return db.select({
      id: transactions.id,
      transactionNumber: transactions.transactionNumber,
      type: transactions.type,
      transactionType: transactions.transactionType,
      clientId: transactions.clientId,
      invoiceId: transactions.invoiceId,
      userId: transactions.userId,
      date: transactions.date,
      amount: transactions.amount,
      paymentMethod: transactions.paymentMethod,
      referenceNumber: transactions.referenceNumber,
      description: transactions.description,
      notes: transactions.notes,
      clientName: clients.name
    })
    .from(transactions)
    .leftJoin(clients, eq(transactions.clientId, clients.id))
    .where(eq(transactions.transactionType, type))
    .orderBy(desc(transactions.date));
  }

  async getTransactionsByDate(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return db.select({
      id: transactions.id,
      transactionNumber: transactions.transactionNumber,
      type: transactions.type,
      transactionType: transactions.transactionType,
      clientId: transactions.clientId,
      invoiceId: transactions.invoiceId,
      userId: transactions.userId,
      date: transactions.date,
      amount: transactions.amount,
      paymentMethod: transactions.paymentMethod,
      referenceNumber: transactions.referenceNumber,
      description: transactions.description,
      notes: transactions.notes,
      clientName: clients.name
    })
    .from(transactions)
    .leftJoin(clients, eq(transactions.clientId, clients.id))
    .where(
      and(
        sql`${transactions.date} >= ${startDate}`,
        sql`${transactions.date} <= ${endDate}`
      )
    )
    .orderBy(desc(transactions.date));
  }

  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    const allSettings = await db.select().from(settings);
    return allSettings[0];
  }

  async updateSettings(settingsData: Partial<InsertSettings>): Promise<Settings> {
    const existing = await this.getSettings();
    
    if (existing) {
      const [updated] = await db.update(settings)
        .set(settingsData)
        .where(eq(settings.id, existing.id))
        .returning();
      
      return updated;
    } else {
      if (!settingsData.companyName) {
        throw new Error("Company name is required for initial settings");
      }
      
      const [created] = await db.insert(settings)
        .values(settingsData as InsertSettings)
        .returning();
      
      return created;
    }
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<any> {
    // Get counts
    const clientCount = await db.select({ count: sql<number>`count(*)` }).from(clients);
    const productCount = await db.select({ count: sql<number>`count(*)` }).from(products);
    const salesCount = await db.select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.invoiceType, "sales"));
    const purchasesCount = await db.select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.invoiceType, "purchase"));
    
    // Get sums
    const salesTotal = await db.select({ sum: sql<string>`sum(total)` })
      .from(invoices)
      .where(eq(invoices.invoiceType, "sales"));
    
    const purchasesTotal = await db.select({ sum: sql<string>`sum(total)` })
      .from(invoices)
      .where(eq(invoices.invoiceType, "purchase"));
    
    // Get recent sales
    const recentSales = await db.select()
      .from(invoices)
      .where(eq(invoices.invoiceType, "sales"))
      .orderBy(desc(invoices.date))
      .limit(5);
    
    // Get low stock products
    const lowStockProducts = await db.select()
      .from(products)
      .where(
        sql`${products.currentStock} <= ${products.minStock}`
      )
      .limit(5);
    
    return {
      counts: {
        clients: clientCount[0].count,
        products: productCount[0].count,
        sales: salesCount[0].count,
        purchases: purchasesCount[0].count
      },
      totals: {
        sales: salesTotal[0].sum || "0",
        purchases: purchasesTotal[0].sum || "0"
      },
      recentSales,
      lowStockProducts
    };
  }

  // Balance methods
  async getClientBalance(clientId: number): Promise<string> {
    // Get the latest balance from balance_history
    const [result] = await db
      .select({ balance: balanceHistory.newBalance })
      .from(balanceHistory)
      .where(eq(balanceHistory.clientId, clientId))
      .orderBy(desc(balanceHistory.date))
      .limit(1);

    return result?.balance || "0";
  }

  async getBalanceHistory(clientId: number): Promise<BalanceHistory[]> {
    return db
      .select()
      .from(balanceHistory)
      .where(eq(balanceHistory.clientId, clientId))
      .orderBy(desc(balanceHistory.date));
  }

  async updateClientBalance(
    clientId: number,
    amount: number,
    type: string,
    transactionId: number,
    description: string
  ): Promise<Client> {
    return await db.transaction(async (tx) => {
      // Get current balance
      const [currentBalance] = await tx
        .select()
        .from(balanceHistory)
        .where(eq(balanceHistory.clientId, clientId))
        .orderBy(desc(balanceHistory.date))
        .limit(1);

      const previousBalance = parseFloat(currentBalance?.newBalance || "0");
      const newBalance = type === "credit" 
        ? previousBalance + amount 
        : previousBalance - amount;

      // Insert balance history record
      await tx.insert(balanceHistory).values({
        clientId,
        transactionId,
        previousBalance: previousBalance.toString(),
        amount: amount.toString(),
        newBalance: newBalance.toString(),
        type,
        description
      });

      // Update client's current balance
      const [updatedClient] = await tx
        .update(clients)
        .set({ balance: newBalance.toString() })
        .where(eq(clients.id, clientId))
        .returning();

      return updatedClient;
    });
  }
}

export const storage = new DatabaseStorage();
