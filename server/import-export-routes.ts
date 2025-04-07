import { Request, Response, Express } from "express";
import { storage } from "./storage";
import { InsertClient, InsertProduct } from "@shared/schema";

export function setupImportExportRoutes(app: Express) {
  // استيراد العملاء من ملف Excel
  app.post("/api/import/clients", async (req: Request, res: Response) => {
    try {
      const { clients } = req.body;
      
      if (!Array.isArray(clients) || clients.length === 0) {
        return res.status(400).json({ error: "لم يتم تقديم بيانات صالحة" });
      }
      
      const importedClients = [];
      
      for (const clientData of clients) {
        // تجاهل الصفوف التي ليس لها اسم
        if (!clientData.name) continue;
        
        // التحقق مما إذا كان العميل موجودًا بالفعل
        const existingClient = await storage.getClientByName(clientData.name);
        
        if (existingClient) {
          // تحديث العميل الموجود
          const updatedClient = await storage.updateClient(existingClient.id, {
            ...clientData,
            // التأكد من أن isActive صحيح
            isActive: clientData.isActive === true || clientData.isActive === "نعم" || clientData.isActive === "true",
          });
          if (updatedClient) {
            importedClients.push(updatedClient);
          }
        } else {
          // إنشاء عميل جديد
          const newClient = await storage.createClient({
            name: clientData.name,
            clientType: clientData.clientType || "عميل",
            phone: clientData.phone || "",
            email: clientData.email || "",
            address: clientData.address || "",
            notes: clientData.notes || "",
            taxId: clientData.taxId || "",
            isActive: clientData.isActive === true || clientData.isActive === "نعم" || clientData.isActive === "true",
          } as InsertClient);
          
          importedClients.push(newClient);
        }
      }
      
      res.json({ success: true, clients: importedClients });
    } catch (error: any) {
      console.error("خطأ في استيراد العملاء:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // استيراد المنتجات من ملف Excel
  app.post("/api/import/products", async (req: Request, res: Response) => {
    try {
      const { products } = req.body;
      
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "لم يتم تقديم بيانات صالحة" });
      }
      
      const importedProducts = [];
      
      for (const productData of products) {
        // تجاهل الصفوف التي ليس لها اسم
        if (!productData.name) continue;
        
        // التحقق مما إذا كان المنتج موجودًا بالفعل
        const existingProduct = await storage.getProductByName(productData.name);
        
        if (existingProduct) {
          // تحديث المنتج الموجود
          const updatedProduct = await storage.updateProduct(existingProduct.id, {
            ...productData,
            // التأكد من أن القيم العددية صحيحة
            buyPrice: productData.buyPrice?.toString() || "0",
            sellPrice: productData.sellPrice?.toString() || "0",
            minStock: Number(productData.minStock) || 0,
            currentStock: productData.currentStock?.toString() || "0",
            // التأكد من أن isActive صحيح
            isActive: productData.isActive === true || productData.isActive === "نعم" || productData.isActive === "true",
          });
          if (updatedProduct) {
            importedProducts.push(updatedProduct);
          }
        } else {
          // إنشاء منتج جديد
          const newProduct = await storage.createProduct({
            name: productData.name,
            code: productData.code || "",
            barcode: productData.barcode || null,
            category: productData.category || null,
            description: productData.description || null,
            unit: productData.unit || "طن",
            buyPrice: productData.buyPrice?.toString() || "0",
            sellPrice: productData.sellPrice?.toString() || "0",
            minStock: Number(productData.minStock) || 0,
            currentStock: productData.currentStock?.toString() || "0",
            isActive: productData.isActive === true || productData.isActive === "نعم" || productData.isActive === "true",
          } as InsertProduct);
          
          importedProducts.push(newProduct);
        }
      }
      
      res.json({ success: true, products: importedProducts });
    } catch (error: any) {
      console.error("خطأ في استيراد المنتجات:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // استيراد نسخة احتياطية كاملة
  app.post("/api/import/backup", async (req: Request, res: Response) => {
    try {
      const { clients, products, invoices, invoiceItems, transactions } = req.body;
      
      // استيراد العملاء
      if (Array.isArray(clients) && clients.length > 0) {
        for (const clientData of clients) {
          if (!clientData.name) continue;
          
          const existingClient = await storage.getClientByName(clientData.name);
          
          if (existingClient) {
            await storage.updateClient(existingClient.id, {
              ...clientData,
              isActive: clientData.isActive === true || clientData.isActive === "نعم" || clientData.isActive === "true",
            });
          } else {
            await storage.createClient({
              name: clientData.name,
              clientType: clientData.clientType || "عميل",
              phone: clientData.phone || "",
              email: clientData.email || "",
              address: clientData.address || "",
              notes: clientData.notes || "",
              taxId: clientData.taxId || "",
              isActive: clientData.isActive === true || clientData.isActive === "نعم" || clientData.isActive === "true",
            } as InsertClient);
          }
        }
      }
      
      // استيراد المنتجات
      if (Array.isArray(products) && products.length > 0) {
        for (const productData of products) {
          if (!productData.name) continue;
          
          const existingProduct = await storage.getProductByName(productData.name);
          
          if (existingProduct) {
            await storage.updateProduct(existingProduct.id, {
              ...productData,
              buyPrice: productData.buyPrice?.toString() || "0",
              sellPrice: productData.sellPrice?.toString() || "0",
              minStock: Number(productData.minStock) || 0,
              currentStock: productData.currentStock?.toString() || "0",
              isActive: productData.isActive === true || productData.isActive === "نعم" || productData.isActive === "true",
            });
          } else {
            await storage.createProduct({
              name: productData.name,
              code: productData.code || "",
              barcode: productData.barcode || null,
              category: productData.category || null,
              description: productData.description || null,
              unit: productData.unit || "طن",
              buyPrice: productData.buyPrice?.toString() || "0",
              sellPrice: productData.sellPrice?.toString() || "0",
              minStock: Number(productData.minStock) || 0,
              currentStock: productData.currentStock?.toString() || "0",
              isActive: productData.isActive === true || productData.isActive === "نعم" || productData.isActive === "true",
            } as InsertProduct);
          }
        }
      }
      
      // استيراد الفواتير وعناصرها والمعاملات سيتم تنفيذه لاحقًا
      // حاليًا نكتفي بالعملاء والمنتجات لأن الفواتير تتطلب معالجة خاصة للعلاقات
      
      res.json({ 
        success: true, 
        message: "تم استيراد البيانات بنجاح",
        counts: {
          clients: clients?.length || 0,
          products: products?.length || 0,
          // invoices: invoices?.length || 0,
          // invoiceItems: invoiceItems?.length || 0,
          // transactions: transactions?.length || 0
        }
      });
    } catch (error: any) {
      console.error("خطأ في استيراد النسخة الاحتياطية:", error);
      res.status(500).json({ error: error.message });
    }
  });
}