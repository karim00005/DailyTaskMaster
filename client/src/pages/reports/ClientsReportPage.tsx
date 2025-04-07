import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  TabsList,
  TabsTrigger,
  Tabs,
  TabsContent
} from "@/components/ui/tabs";
import { 
  Loader2, 
  Search, 
  FileDown, 
  Printer,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Client, Invoice, Transaction } from "@shared/schema";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function ClientsReportPage() {
  // Search query
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch clients
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch invoices
  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Fetch transactions
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Filter clients based on search query
  const filteredClients = clients?.filter(client => 
    !searchQuery || 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate client stats
  const clientStats = filteredClients?.map(client => {
    // Get client's invoices
    const clientInvoices = invoices?.filter(invoice => invoice.clientId === client.id) || [];
    
    // Calculate total sales (invoices with type "sale")
    const salesInvoices = clientInvoices.filter(invoice => invoice.type === "sale");
    const totalSales = salesInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    
    // Calculate total purchases (invoices with type "purchase")
    const purchaseInvoices = clientInvoices.filter(invoice => invoice.type === "purchase");
    const totalPurchases = purchaseInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    
    // Calculate payments and receivables
    const salesPaid = salesInvoices.reduce((sum, invoice) => sum + (invoice.paid || 0), 0);
    const salesDue = totalSales - salesPaid;
    
    const purchasesPaid = purchaseInvoices.reduce((sum, invoice) => sum + (invoice.paid || 0), 0);
    const purchasesDue = totalPurchases - purchasesPaid;
    
    return {
      id: client.id,
      name: client.name,
      phone: client.phone || "—",
      email: client.email || "—",
      isActive: client.isActive,
      salesCount: salesInvoices.length,
      totalSales,
      salesPaid,
      salesDue,
      purchasesCount: purchaseInvoices.length,
      totalPurchases,
      purchasesPaid,
      purchasesDue,
    };
  });

  // Generate chart data - top clients by sales
  const topClientsBySales = [...(clientStats || [])]
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 10)
    .map(client => ({
      name: client.name,
      sales: client.totalSales,
    }));

  // Generate chart data - top clients by purchases
  const topClientsByPurchases = [...(clientStats || [])]
    .sort((a, b) => b.totalPurchases - a.totalPurchases)
    .slice(0, 10)
    .map(client => ({
      name: client.name,
      purchases: client.totalPurchases,
    }));

  // Calculate total statistics
  const totalActiveClients = filteredClients?.filter(client => client.isActive).length || 0;
  const totalInactiveClients = filteredClients?.filter(client => !client.isActive).length || 0;
  const totalSales = clientStats?.reduce((sum, client) => sum + client.totalSales, 0) || 0;
  const totalSalesReceivables = clientStats?.reduce((sum, client) => sum + client.salesDue, 0) || 0;
  
  // Loading state
  if (isLoadingClients) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">تقرير العملاء</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
          <Button variant="outline">
            <FileDown className="h-4 w-4 ml-2" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>تصفية البيانات</CardTitle>
          <CardDescription>
            البحث في قائمة العملاء
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو رقم الهاتف أو البريد الإلكتروني..."
              className="pr-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              إجمالي العملاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredClients?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              العملاء النشطين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveClients}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              إجمالي المبيعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales.toLocaleString()} جم</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              المستحقات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesReceivables.toLocaleString()} جم</div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full border-b">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
          <TabsTrigger value="purchases">المشتريات</TabsTrigger>
          <TabsTrigger value="details">تفاصيل العملاء</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Top Clients by Sales */}
            <Card>
              <CardHeader>
                <CardTitle>أعلى العملاء مبيعاً</CardTitle>
                <CardDescription>
                  العملاء الأكثر شراءً حسب إجمالي قيمة المبيعات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {topClientsBySales.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={topClientsBySales}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => `${Number(value).toLocaleString()} جم`} />
                        <Legend />
                        <Bar dataKey="sales" name="المبيعات" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      لا توجد بيانات كافية لعرض الرسم البياني
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Clients by Purchases */}
            <Card>
              <CardHeader>
                <CardTitle>أعلى الموردين</CardTitle>
                <CardDescription>
                  الموردين الأكثر توريداً حسب إجمالي قيمة المشتريات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {topClientsByPurchases.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={topClientsByPurchases}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => `${Number(value).toLocaleString()} جم`} />
                        <Legend />
                        <Bar dataKey="purchases" name="المشتريات" fill="#9333ea" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      لا توجد بيانات كافية لعرض الرسم البياني
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Sales Tab */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>مبيعات العملاء</CardTitle>
              <CardDescription>
                إجمالي المبيعات والمستحقات لكل عميل
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead>عدد الفواتير</TableHead>
                    <TableHead>إجمالي المبيعات</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المستحق</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientStats
                    ?.filter(client => client.salesCount > 0)
                    .sort((a, b) => b.totalSales - a.totalSales)
                    .map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.salesCount}</TableCell>
                        <TableCell>{client.totalSales.toLocaleString()} جم</TableCell>
                        <TableCell>{client.salesPaid.toLocaleString()} جم</TableCell>
                        <TableCell className={client.salesDue > 0 ? "text-red-600 font-medium" : ""}>
                          {client.salesDue.toLocaleString()} جم
                        </TableCell>
                      </TableRow>
                    )) || (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                        لا توجد بيانات للعرض
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Purchases Tab */}
        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>المشتريات من الموردين</CardTitle>
              <CardDescription>
                إجمالي المشتريات والمستحقات لكل مورد
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المورد</TableHead>
                    <TableHead>عدد الفواتير</TableHead>
                    <TableHead>إجمالي المشتريات</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المستحق</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientStats
                    ?.filter(client => client.purchasesCount > 0)
                    .sort((a, b) => b.totalPurchases - a.totalPurchases)
                    .map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.purchasesCount}</TableCell>
                        <TableCell>{client.totalPurchases.toLocaleString()} جم</TableCell>
                        <TableCell>{client.purchasesPaid.toLocaleString()} جم</TableCell>
                        <TableCell className={client.purchasesDue > 0 ? "text-red-600 font-medium" : ""}>
                          {client.purchasesDue.toLocaleString()} جم
                        </TableCell>
                      </TableRow>
                    )) || (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                        لا توجد بيانات للعرض
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل العملاء</CardTitle>
              <CardDescription>
                معلومات تفصيلية عن العملاء والموردين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المبيعات</TableHead>
                    <TableHead>المستحقات</TableHead>
                    <TableHead>المشتريات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientStats?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>
                        {client.isActive ? (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                            <span>نشط</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="h-4 w-4 text-red-500 ml-1" />
                            <span>غير نشط</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{client.totalSales.toLocaleString()} جم</TableCell>
                      <TableCell className={client.salesDue > 0 ? "text-red-600 font-medium" : ""}>
                        {client.salesDue.toLocaleString()} جم
                      </TableCell>
                      <TableCell>{client.totalPurchases.toLocaleString()} جم</TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                        لا توجد بيانات للعرض
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}