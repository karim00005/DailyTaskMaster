import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertClientSchema,
  insertProductSchema,
  insertWarehouseSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertTransactionSchema,
  insertSettingsSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { setupImportExportRoutes } from "./import-export-routes";
import Stripe from "stripe";

// Initialize Stripe if the API key is available
let stripe: Stripe | undefined;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' as any,
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up import/export routes
  setupImportExportRoutes(app);

  // User routes
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.data.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(validatedData.data);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const validatedData = insertUserSchema.partial().safeParse(req.body);
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Check if username is being changed and already exists
      if (validatedData.data.username) {
        const existingUser = await storage.getUserByUsername(validatedData.data.username);
        if (existingUser && existingUser.id !== id) {
          return res.status(409).json({ message: "Username already exists" });
        }
      }
      
      const updatedUser = await storage.updateUser(id, validatedData.data);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req: Request, res: Response) => {
    try {
      const activeOnly = req.query.active === "true";
      const clients = activeOnly 
        ? await storage.getActiveClients()
        : await storage.getAllClients();
      
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req: Request, res: Response) => {
    try {
      const validatedData = insertClientSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Check if name already exists
      const existingClient = await storage.getClientByName(validatedData.data.name);
      if (existingClient) {
        return res.status(409).json({ message: "Client name already exists" });
      }
      
      const newClient = await storage.createClient(validatedData.data);
      res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const validatedData = insertClientSchema.partial().safeParse(req.body);
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Check if name is being changed and already exists
      if (validatedData.data.name) {
        const existingClient = await storage.getClientByName(validatedData.data.name);
        if (existingClient && existingClient.id !== id) {
          return res.status(409).json({ message: "Client name already exists" });
        }
      }
      
      const updatedClient = await storage.updateClient(id, validatedData.data);
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Product routes
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const activeOnly = req.query.active === "true";
      const products = activeOnly 
        ? await storage.getActiveProducts()
        : await storage.getAllProducts();
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Check if name already exists
      const existingProduct = await storage.getProductByName(validatedData.data.name);
      if (existingProduct) {
        return res.status(409).json({ message: "Product name already exists" });
      }
      
      const newProduct = await storage.createProduct(validatedData.data);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const validatedData = insertProductSchema.partial().safeParse(req.body);
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Check if name is being changed and already exists
      if (validatedData.data.name) {
        const existingProduct = await storage.getProductByName(validatedData.data.name);
        if (existingProduct && existingProduct.id !== id) {
          return res.status(409).json({ message: "Product name already exists" });
        }
      }
      
      const updatedProduct = await storage.updateProduct(id, validatedData.data);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Warehouse routes
  app.get("/api/warehouses", async (req: Request, res: Response) => {
    try {
      const warehouses = await storage.getAllWarehouses();
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ message: "Failed to fetch warehouses" });
    }
  });

  app.get("/api/warehouses/default", async (req: Request, res: Response) => {
    try {
      const warehouse = await storage.getDefaultWarehouse();
      if (!warehouse) {
        return res.status(404).json({ message: "No default warehouse found" });
      }
      
      res.json(warehouse);
    } catch (error) {
      console.error("Error fetching default warehouse:", error);
      res.status(500).json({ message: "Failed to fetch default warehouse" });
    }
  });

  app.get("/api/warehouses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid warehouse ID" });
      }
      
      const warehouse = await storage.getWarehouse(id);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      
      res.json(warehouse);
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      res.status(500).json({ message: "Failed to fetch warehouse" });
    }
  });

  app.post("/api/warehouses", async (req: Request, res: Response) => {
    try {
      const validatedData = insertWarehouseSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // If this warehouse is set as default, unset any existing default
      if (validatedData.data.isDefault) {
        const defaultWarehouse = await storage.getDefaultWarehouse();
        if (defaultWarehouse) {
          await storage.updateWarehouse(defaultWarehouse.id, { isDefault: false });
        }
      }
      
      const newWarehouse = await storage.createWarehouse(validatedData.data);
      res.status(201).json(newWarehouse);
    } catch (error) {
      console.error("Error creating warehouse:", error);
      res.status(500).json({ message: "Failed to create warehouse" });
    }
  });

  app.patch("/api/warehouses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid warehouse ID" });
      }
      
      const validatedData = insertWarehouseSchema.partial().safeParse(req.body);
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // If this warehouse is set as default, unset any existing default
      if (validatedData.data.isDefault) {
        const defaultWarehouse = await storage.getDefaultWarehouse();
        if (defaultWarehouse && defaultWarehouse.id !== id) {
          await storage.updateWarehouse(defaultWarehouse.id, { isDefault: false });
        }
      }
      
      const updatedWarehouse = await storage.updateWarehouse(id, validatedData.data);
      if (!updatedWarehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      
      res.json(updatedWarehouse);
    } catch (error) {
      console.error("Error updating warehouse:", error);
      res.status(500).json({ message: "Failed to update warehouse" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req: Request, res: Response) => {
    try {
      // Handle various filters
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const invoiceType = req.query.type as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      let invoices;
      
      if (clientId && !isNaN(clientId)) {
        invoices = await storage.getInvoicesByClient(clientId);
      } else if (invoiceType) {
        invoices = await storage.getInvoicesByType(invoiceType);
      } else if (startDate && endDate) {
        invoices = await storage.getInvoicesByDate(startDate, endDate);
      } else {
        invoices = await storage.getAllInvoices();
      }
      
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const includeItems = req.query.items === "true";
      
      if (includeItems) {
        const invoiceWithItems = await storage.getInvoiceWithItems(id);
        if (!invoiceWithItems) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        return res.json(invoiceWithItems);
      }
      
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req: Request, res: Response) => {
    try {
      const { invoice, items } = req.body;
      
      const validatedInvoice = insertInvoiceSchema.safeParse(invoice);
      if (!validatedInvoice.success) {
        const errorMessage = fromZodError(validatedInvoice.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Validate each item
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Items must be an array" });
      }
      
      const validatedItems = [];
      for (const item of items) {
        const validatedItem = insertInvoiceItemSchema.omit({ invoiceId: true }).safeParse(item);
        if (!validatedItem.success) {
          const errorMessage = fromZodError(validatedItem.error).message;
          return res.status(400).json({ message: errorMessage });
        }
        validatedItems.push(validatedItem.data);
      }
      
      const newInvoice = await storage.createInvoice(validatedInvoice.data, validatedItems);
      res.status(201).json(newInvoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.patch("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const validatedData = insertInvoiceSchema.partial().safeParse(req.body);
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const updatedInvoice = await storage.updateInvoice(id, validatedData.data);
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const success = await storage.deleteInvoice(id);
      if (!success) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Invoice Items routes
  app.get("/api/invoice-items/:invoiceId", async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const items = await storage.getInvoiceItems(invoiceId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching invoice items:", error);
      res.status(500).json({ message: "Failed to fetch invoice items" });
    }
  });

  app.post("/api/invoice-items", async (req: Request, res: Response) => {
    try {
      const validatedData = insertInvoiceItemSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const newItem = await storage.createInvoiceItem(validatedData.data);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating invoice item:", error);
      res.status(500).json({ message: "Failed to create invoice item" });
    }
  });

  app.patch("/api/invoice-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const validatedData = insertInvoiceItemSchema.partial().safeParse(req.body);
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const updatedItem = await storage.updateInvoiceItem(id, validatedData.data);
      if (!updatedItem) {
        return res.status(404).json({ message: "Invoice item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating invoice item:", error);
      res.status(500).json({ message: "Failed to update invoice item" });
    }
  });

  app.delete("/api/invoice-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const success = await storage.deleteInvoiceItem(id);
      if (!success) {
        return res.status(404).json({ message: "Invoice item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      res.status(500).json({ message: "Failed to delete invoice item" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req: Request, res: Response) => {
    try {
      // Handle various filters
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const transactionType = req.query.type as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      let transactions;
      
      if (clientId && !isNaN(clientId)) {
        transactions = await storage.getTransactionsByClient(clientId);
      } else if (transactionType) {
        transactions = await storage.getTransactionsByType(transactionType);
      } else if (startDate && endDate) {
        transactions = await storage.getTransactionsByDate(startDate, endDate);
      } else {
        transactions = await storage.getAllTransactions();
      }
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTransactionSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const newTransaction = await storage.createTransaction(validatedData.data);
      res.status(201).json(newTransaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.patch("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      const validatedData = insertTransactionSchema.partial().safeParse(req.body);
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const updatedTransaction = await storage.updateTransaction(id, validatedData.data);
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      const success = await storage.deleteTransaction(id);
      if (!success) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSettingsSchema.partial().safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const settings = await storage.updateSettings(validatedData.data);
      res.status(200).json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Stripe payment routes
  if (stripe) {
    app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
      try {
        const { amount, currency = "usd" } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          currency,
        });
        
        res.json({ 
          clientSecret: paymentIntent.client_secret 
        });
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ message: error.message });
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
