import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Client, Product, Invoice, InvoiceItem, Transaction } from '@shared/schema';
import { formatDate } from './date-utils';
import { apiRequest } from './queryClient';

/**
 * تنزيل قالب إكسل فارغ للعملاء
 */
export async function downloadClientTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('العملاء');
  
  // إنشاء الأعمدة
  worksheet.columns = [
    { header: 'الاسم', key: 'name', width: 30 },
    { header: 'النوع', key: 'clientType', width: 15 },
    { header: 'رقم الهاتف', key: 'phone', width: 20 },
    { header: 'البريد الإلكتروني', key: 'email', width: 25 },
    { header: 'العنوان', key: 'address', width: 40 },
    { header: 'الملاحظات', key: 'notes', width: 30 },
    { header: 'الرقم الضريبي', key: 'taxId', width: 20 },
    { header: 'نشط', key: 'isActive', width: 10 }
  ];
  
  // تنسيق الصف الأول
  worksheet.getRow(1).font = { bold: true };
  
  // إضافة بعض البيانات النموذجية
  worksheet.addRow({
    name: 'عميل نموذجي',
    clientType: 'عميل',
    phone: '0123456789',
    email: 'example@example.com',
    address: 'عنوان العميل',
    notes: 'ملاحظات',
    taxId: '123456789',
    isActive: true
  });
  
  // حفظ الملف
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'client_template.xlsx');
}

/**
 * تنزيل قالب إكسل فارغ للمنتجات
 */
export async function downloadProductTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('المنتجات');
  
  // إنشاء الأعمدة
  worksheet.columns = [
    { header: 'الاسم', key: 'name', width: 30 },
    { header: 'الكود', key: 'code', width: 15 },
    { header: 'الباركود', key: 'barcode', width: 20 },
    { header: 'التصنيف', key: 'category', width: 20 },
    { header: 'الوصف', key: 'description', width: 40 },
    { header: 'وحدة القياس', key: 'unit', width: 15 },
    { header: 'سعر الشراء', key: 'buyPrice', width: 15 },
    { header: 'سعر البيع', key: 'sellPrice', width: 15 },
    { header: 'الحد الأدنى', key: 'minStock', width: 15 },
    { header: 'المخزون الحالي', key: 'currentStock', width: 15 },
    { header: 'نشط', key: 'isActive', width: 10 }
  ];
  
  // تنسيق الصف الأول
  worksheet.getRow(1).font = { bold: true };
  
  // إضافة بعض البيانات النموذجية
  worksheet.addRow({
    name: 'منتج نموذجي',
    code: 'P001',
    barcode: '123456789',
    category: 'تصنيف',
    description: 'وصف المنتج',
    unit: 'طن',
    buyPrice: '100',
    sellPrice: '120',
    minStock: 10,
    currentStock: '50',
    isActive: true
  });
  
  // حفظ الملف
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'product_template.xlsx');
}

/**
 * تصدير العملاء إلى ملف إكسل
 */
export async function exportClientsToExcel(clients: Client[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('العملاء');
  
  // إنشاء الأعمدة
  worksheet.columns = [
    { header: 'الرقم', key: 'id', width: 10 },
    { header: 'الاسم', key: 'name', width: 30 },
    { header: 'النوع', key: 'clientType', width: 15 },
    { header: 'رقم الهاتف', key: 'phone', width: 20 },
    { header: 'البريد الإلكتروني', key: 'email', width: 25 },
    { header: 'العنوان', key: 'address', width: 40 },
    { header: 'الملاحظات', key: 'notes', width: 30 },
    { header: 'الرقم الضريبي', key: 'taxId', width: 20 },
    { header: 'نشط', key: 'isActive', width: 10 },
    { header: 'تاريخ الإنشاء', key: 'createdAt', width: 20 }
  ];
  
  // تنسيق الصف الأول
  worksheet.getRow(1).font = { bold: true };
  
  // إضافة البيانات
  clients.forEach(client => {
    worksheet.addRow({
      id: client.id,
      name: client.name,
      clientType: client.clientType,
      phone: client.phone,
      email: client.email,
      address: client.address,
      notes: client.notes,
      taxId: client.taxId,
      isActive: client.isActive ? 'نعم' : 'لا',
      createdAt: client.createdAt ? formatDate(new Date(client.createdAt)) : ''
    });
  });
  
  // حفظ الملف
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `clients_${formatDate(new Date())}.xlsx`);
}

/**
 * تصدير المنتجات إلى ملف إكسل
 */
export async function exportProductsToExcel(products: Product[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('المنتجات');
  
  // إنشاء الأعمدة
  worksheet.columns = [
    { header: 'الرقم', key: 'id', width: 10 },
    { header: 'الاسم', key: 'name', width: 30 },
    { header: 'الكود', key: 'code', width: 15 },
    { header: 'الباركود', key: 'barcode', width: 20 },
    { header: 'التصنيف', key: 'category', width: 20 },
    { header: 'الوصف', key: 'description', width: 40 },
    { header: 'وحدة القياس', key: 'unit', width: 15 },
    { header: 'سعر الشراء', key: 'buyPrice', width: 15 },
    { header: 'سعر البيع', key: 'sellPrice', width: 15 },
    { header: 'الحد الأدنى', key: 'minStock', width: 15 },
    { header: 'المخزون الحالي', key: 'currentStock', width: 15 },
    { header: 'نشط', key: 'isActive', width: 10 },
    { header: 'تاريخ الإنشاء', key: 'createdAt', width: 20 }
  ];
  
  // تنسيق الصف الأول
  worksheet.getRow(1).font = { bold: true };
  
  // إضافة البيانات
  products.forEach(product => {
    worksheet.addRow({
      id: product.id,
      name: product.name,
      code: product.code,
      barcode: product.barcode,
      category: product.category,
      description: product.description,
      unit: product.unit,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      minStock: product.minStock,
      currentStock: product.currentStock,
      isActive: product.isActive ? 'نعم' : 'لا',
      createdAt: product.createdAt ? formatDate(new Date(product.createdAt)) : ''
    });
  });
  
  // حفظ الملف
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `products_${formatDate(new Date())}.xlsx`);
}

/**
 * تصدير الفواتير إلى ملف إكسل
 */
export async function exportInvoicesToExcel(invoices: Invoice[], clientMap: Record<number, string>) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('الفواتير');
  
  // إنشاء الأعمدة
  worksheet.columns = [
    { header: 'الرقم', key: 'id', width: 10 },
    { header: 'رقم الفاتورة', key: 'invoiceNumber', width: 20 },
    { header: 'التاريخ', key: 'date', width: 15 },
    { header: 'تاريخ الاستحقاق', key: 'dueDate', width: 15 },
    { header: 'نوع الفاتورة', key: 'invoiceType', width: 15 },
    { header: 'العميل', key: 'clientName', width: 30 },
    { header: 'الإجمالي الفرعي', key: 'subTotal', width: 15 },
    { header: 'الخصم', key: 'discount', width: 15 },
    { header: 'الضريبة', key: 'tax', width: 15 },
    { header: 'الإجمالي', key: 'total', width: 15 },
    { header: 'المدفوع', key: 'paid', width: 15 },
    { header: 'المتبقي', key: 'due', width: 15 },
    { header: 'الحالة', key: 'status', width: 15 },
    { header: 'ملاحظات', key: 'notes', width: 30 }
  ];
  
  // تنسيق الصف الأول
  worksheet.getRow(1).font = { bold: true };
  
  // إضافة البيانات
  invoices.forEach(invoice => {
    worksheet.addRow({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: formatDate(new Date(invoice.date)),
      dueDate: invoice.due ? formatDate(new Date(invoice.due)) : '',
      invoiceType: invoice.invoiceType,
      clientName: invoice.clientId ? clientMap[invoice.clientId] : '',
      subTotal: invoice.subTotal,
      discount: invoice.discount,
      tax: invoice.tax,
      total: invoice.total,
      paid: invoice.paid,
      due: invoice.due,
      status: invoice.status,
      notes: invoice.notes
    });
  });
  
  // حفظ الملف
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `invoices_${formatDate(new Date())}.xlsx`);
}

/**
 * تصدير المعاملات المالية إلى ملف إكسل
 */
export async function exportTransactionsToExcel(transactions: Transaction[], clientMap: Record<number, string>) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('المعاملات');
  
  // إنشاء الأعمدة
  worksheet.columns = [
    { header: 'الرقم', key: 'id', width: 10 },
    { header: 'رقم المعاملة', key: 'transactionNumber', width: 20 },
    { header: 'التاريخ', key: 'date', width: 15 },
    { header: 'نوع المعاملة', key: 'transactionType', width: 15 },
    { header: 'العميل', key: 'clientName', width: 30 },
    { header: 'المبلغ', key: 'amount', width: 15 },
    { header: 'وسيلة الدفع', key: 'paymentMethod', width: 15 },
    { header: 'الوصف', key: 'description', width: 30 },
    { header: 'ملاحظات', key: 'notes', width: 30 },
    { header: 'الرقم المرجعي', key: 'referenceNumber', width: 20 }
  ];
  
  // تنسيق الصف الأول
  worksheet.getRow(1).font = { bold: true };
  
  // إضافة البيانات
  transactions.forEach(transaction => {
    worksheet.addRow({
      id: transaction.id,
      transactionNumber: transaction.transactionNumber,
      date: formatDate(new Date(transaction.date)),
      transactionType: transaction.transactionType,
      clientName: transaction.clientId ? clientMap[transaction.clientId] : '',
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      description: transaction.description,
      notes: transaction.notes,
      referenceNumber: transaction.referenceNumber
    });
  });
  
  // حفظ الملف
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `transactions_${formatDate(new Date())}.xlsx`);
}

/**
 * استيراد العملاء من ملف إكسل
 */
export async function importClientsFromExcel(file: File): Promise<Client[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(e.target?.result as ArrayBuffer);
        
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
          reject(new Error('ورقة العمل غير موجودة'));
          return;
        }
        
        const clients: any[] = [];
        
        // قراءة عناوين الأعمدة
        const headers: Record<number, string> = {};
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value as string;
        });
        
        // قراءة البيانات
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // تخطي صف العناوين
            const client: Record<string, any> = {};
            
            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber];
              if (header === 'isActive') {
                // تحويل "نعم/لا" إلى true/false
                client[header] = cell.value === 'نعم' || cell.value === true || cell.value === 'true';
              } else {
                client[header] = cell.value;
              }
            });
            
            clients.push(client);
          }
        });
        
        // إرسال البيانات إلى الخادم
        const response = await apiRequest('POST', '/api/import/clients', { clients });
        const data = await response.json();
        
        resolve(data.clients);
      } catch (error) {
        console.error('خطأ في استيراد العملاء:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('حدث خطأ أثناء قراءة الملف'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * استيراد المنتجات من ملف إكسل
 */
export async function importProductsFromExcel(file: File): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(e.target?.result as ArrayBuffer);
        
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
          reject(new Error('ورقة العمل غير موجودة'));
          return;
        }
        
        const products: any[] = [];
        
        // قراءة عناوين الأعمدة
        const headers: Record<number, string> = {};
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value as string;
        });
        
        // قراءة البيانات
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // تخطي صف العناوين
            const product: Record<string, any> = {};
            
            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber];
              if (header === 'isActive') {
                // تحويل "نعم/لا" إلى true/false
                product[header] = cell.value === 'نعم' || cell.value === true || cell.value === 'true';
              } else {
                product[header] = cell.value;
              }
            });
            
            products.push(product);
          }
        });
        
        // إرسال البيانات إلى الخادم
        const response = await apiRequest('POST', '/api/import/products', { products });
        const data = await response.json();
        
        resolve(data.products);
      } catch (error) {
        console.error('خطأ في استيراد المنتجات:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('حدث خطأ أثناء قراءة الملف'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * تصدير نسخة احتياطية كاملة
 */
export async function exportFullBackup(
  clients: Client[],
  products: Product[],
  invoices: Invoice[],
  invoiceItems: InvoiceItem[],
  transactions: Transaction[]
) {
  const workbook = new ExcelJS.Workbook();
  
  // ورقة العملاء
  const clientsSheet = workbook.addWorksheet('العملاء');
  clientsSheet.columns = [
    { header: 'الرقم', key: 'id', width: 10 },
    { header: 'الاسم', key: 'name', width: 30 },
    { header: 'النوع', key: 'clientType', width: 15 },
    { header: 'رقم الهاتف', key: 'phone', width: 20 },
    { header: 'البريد الإلكتروني', key: 'email', width: 25 },
    { header: 'العنوان', key: 'address', width: 40 },
    { header: 'الملاحظات', key: 'notes', width: 30 },
    { header: 'الرقم الضريبي', key: 'taxId', width: 20 },
    { header: 'نشط', key: 'isActive', width: 10 }
  ];
  clientsSheet.getRow(1).font = { bold: true };
  clients.forEach(client => clientsSheet.addRow(client));
  
  // ورقة المنتجات
  const productsSheet = workbook.addWorksheet('المنتجات');
  productsSheet.columns = [
    { header: 'الرقم', key: 'id', width: 10 },
    { header: 'الاسم', key: 'name', width: 30 },
    { header: 'الكود', key: 'code', width: 15 },
    { header: 'الباركود', key: 'barcode', width: 20 },
    { header: 'التصنيف', key: 'category', width: 20 },
    { header: 'الوصف', key: 'description', width: 40 },
    { header: 'وحدة القياس', key: 'unit', width: 15 },
    { header: 'سعر الشراء', key: 'buyPrice', width: 15 },
    { header: 'سعر البيع', key: 'sellPrice', width: 15 },
    { header: 'الحد الأدنى', key: 'minStock', width: 15 },
    { header: 'المخزون الحالي', key: 'currentStock', width: 15 },
    { header: 'نشط', key: 'isActive', width: 10 }
  ];
  productsSheet.getRow(1).font = { bold: true };
  products.forEach(product => productsSheet.addRow(product));
  
  // ورقة الفواتير
  const invoicesSheet = workbook.addWorksheet('الفواتير');
  invoicesSheet.columns = [
    { header: 'الرقم', key: 'id', width: 10 },
    { header: 'رقم الفاتورة', key: 'invoiceNumber', width: 20 },
    { header: 'التاريخ', key: 'date', width: 15 },
    { header: 'نوع الفاتورة', key: 'invoiceType', width: 15 },
    { header: 'العميل', key: 'clientId', width: 15 },
    { header: 'المستخدم', key: 'userId', width: 15 },
    { header: 'الإجمالي الفرعي', key: 'subTotal', width: 15 },
    { header: 'الخصم', key: 'discount', width: 15 },
    { header: 'الضريبة', key: 'tax', width: 15 },
    { header: 'الإجمالي', key: 'total', width: 15 },
    { header: 'المدفوع', key: 'paid', width: 15 },
    { header: 'المتبقي', key: 'due', width: 15 },
    { header: 'الحالة', key: 'status', width: 15 },
    { header: 'ملاحظات', key: 'notes', width: 30 }
  ];
  invoicesSheet.getRow(1).font = { bold: true };
  invoices.forEach(invoice => {
    const row = {
      ...invoice,
      date: formatDate(new Date(invoice.date)),
      due: invoice.due ? formatDate(new Date(invoice.due)) : ''
    };
    invoicesSheet.addRow(row);
  });
  
  // ورقة عناصر الفواتير
  const invoiceItemsSheet = workbook.addWorksheet('عناصر الفواتير');
  invoiceItemsSheet.columns = [
    { header: 'الرقم', key: 'id', width: 10 },
    { header: 'رقم الفاتورة', key: 'invoiceId', width: 15 },
    { header: 'رقم المنتج', key: 'productId', width: 15 },
    { header: 'اسم المنتج', key: 'productName', width: 30 },
    { header: 'الكمية', key: 'quantity', width: 15 },
    { header: 'السعر', key: 'price', width: 15 },
    { header: 'الخصم', key: 'discount', width: 15 },
    { header: 'الضريبة', key: 'tax', width: 15 },
    { header: 'الإجمالي', key: 'total', width: 15 }
  ];
  invoiceItemsSheet.getRow(1).font = { bold: true };
  invoiceItems.forEach(item => invoiceItemsSheet.addRow(item));
  
  // ورقة المعاملات المالية
  const transactionsSheet = workbook.addWorksheet('المعاملات');
  transactionsSheet.columns = [
    { header: 'الرقم', key: 'id', width: 10 },
    { header: 'رقم المعاملة', key: 'transactionNumber', width: 20 },
    { header: 'التاريخ', key: 'date', width: 15 },
    { header: 'النوع', key: 'type', width: 15 },
    { header: 'نوع المعاملة', key: 'transactionType', width: 15 },
    { header: 'العميل', key: 'clientId', width: 15 },
    { header: 'المستخدم', key: 'userId', width: 15 },
    { header: 'المبلغ', key: 'amount', width: 15 },
    { header: 'وسيلة الدفع', key: 'paymentMethod', width: 15 },
    { header: 'الوصف', key: 'description', width: 30 },
    { header: 'ملاحظات', key: 'notes', width: 30 },
    { header: 'الرقم المرجعي', key: 'referenceNumber', width: 20 }
  ];
  transactionsSheet.getRow(1).font = { bold: true };
  transactions.forEach(transaction => {
    const row = {
      ...transaction,
      date: formatDate(new Date(transaction.date))
    };
    transactionsSheet.addRow(row);
  });
  
  // حفظ الملف
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `business_backup_${formatDate(new Date())}.xlsx`);
}

/**
 * استيراد نسخة احتياطية كاملة
 */
export async function importFullBackup(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(e.target?.result as ArrayBuffer);
        
        // استخراج البيانات من كل ورقة
        const data: Record<string, any[]> = {
          clients: [],
          products: [],
          invoices: [],
          invoiceItems: [],
          transactions: []
        };
        
        // استخراج بيانات العملاء
        const clientsSheet = workbook.getWorksheet('العملاء');
        if (clientsSheet) {
          data.clients = extractDataFromWorksheet(clientsSheet);
        }
        
        // استخراج بيانات المنتجات
        const productsSheet = workbook.getWorksheet('المنتجات');
        if (productsSheet) {
          data.products = extractDataFromWorksheet(productsSheet);
        }
        
        // استخراج بيانات الفواتير
        const invoicesSheet = workbook.getWorksheet('الفواتير');
        if (invoicesSheet) {
          data.invoices = extractDataFromWorksheet(invoicesSheet);
        }
        
        // استخراج بيانات عناصر الفواتير
        const invoiceItemsSheet = workbook.getWorksheet('عناصر الفواتير');
        if (invoiceItemsSheet) {
          data.invoiceItems = extractDataFromWorksheet(invoiceItemsSheet);
        }
        
        // استخراج بيانات المعاملات المالية
        const transactionsSheet = workbook.getWorksheet('المعاملات');
        if (transactionsSheet) {
          data.transactions = extractDataFromWorksheet(transactionsSheet);
        }
        
        // إرسال البيانات إلى الخادم
        const response = await apiRequest('POST', '/api/import/backup', data);
        const result = await response.json();
        
        resolve(result);
      } catch (error) {
        console.error('خطأ في استيراد النسخة الاحتياطية:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('حدث خطأ أثناء قراءة الملف'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * استخراج البيانات من ورقة عمل إكسل
 */
function extractDataFromWorksheet(worksheet: ExcelJS.Worksheet): any[] {
  const data: any[] = [];
  
  // قراءة عناوين الأعمدة
  const headers: Record<number, string> = {};
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value as string;
  });
  
  // قراءة البيانات
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // تخطي صف العناوين
      const item: Record<string, any> = {};
      
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header === 'isActive') {
          // تحويل "نعم/لا" إلى true/false
          item[header] = cell.value === 'نعم' || cell.value === true || cell.value === 'true';
        } else {
          item[header] = cell.value;
        }
      });
      
      data.push(item);
    }
  });
  
  return data;
}