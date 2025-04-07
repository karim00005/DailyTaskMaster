import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Package, FileText, DollarSign, AlertTriangle, Wallet, Search, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type DashboardStats = {
  counts: {
    clients: number;
    products: number;
    sales: number;
    purchases: number;
  };
  totals: {
    sales: string;
    purchases: string;
  };
  recentSales: any[];
  lowStockProducts: any[];
};

type Client = {
  id: number;
  name: string;
  balance: string;
  clientType: string;
};

type Product = {
  id: number;
  name: string;
  code: string | null;
  currentStock: string;
  unit: string;
  sellPrice: string;
  buyPrice: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/stats");
      return res.json();
    },
  });

  // Fetch all clients
  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      return res.json();
    },
  });

  // Fetch all products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/products");
      return res.json();
    },
  });

  const isLoading = statsLoading || clientsLoading || productsLoading;

  // Filter clients with non-zero balance and by search term
  const filteredClients = (clients || [])
    .filter(client => client.balance !== "0" && parseFloat(client.balance) !== 0)
    .filter(client => client.name.includes(clientSearch));
  
  // Filter products by search term
  const filteredProducts = (products || [])
    .filter(product => product.name.includes(productSearch));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">الصفحة الرئيسية</h1>
        <div className="text-muted-foreground">
          مرحباً، {user?.fullName} 👋
        </div>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي أرصدة العملاء (مدين)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Wallet className="h-5 w-5 text-primary ml-2" />
              <div className="text-2xl font-bold">
                {(clients || [])
                  .filter(client => parseFloat(client.balance) > 0)
                  .reduce((total, client) => total + parseFloat(client.balance), 0)
                  .toLocaleString()} جم
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي أرصدة الموردين (دائن)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Wallet className="h-5 w-5 text-destructive ml-2" />
              <div className="text-2xl font-bold">
                {Math.abs((clients || [])
                  .filter(client => parseFloat(client.balance) < 0)
                  .reduce((total, client) => total + parseFloat(client.balance), 0))
                  .toLocaleString()} جم
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              قيمة المخزون الحالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-5 w-5 text-primary ml-2" />
              <div className="text-2xl font-bold">
                {(products || [])
                  .reduce((total, product) => 
                    total + (parseFloat(product.currentStock) * parseFloat(product.buyPrice)), 0)
                  .toLocaleString()} جم
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              المنتجات قليلة المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-destructive ml-2" />
              <div className="text-2xl font-bold">
                {(stats?.lowStockProducts?.length || 0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients with non-zero balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>أرصدة العملاء والموردين</CardTitle>
                <CardDescription>العملاء والموردين ذوي الأرصدة</CardDescription>
              </div>
              <Link href="/clients/new">
                <Button size="sm" className="h-8">
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة عميل
                </Button>
              </Link>
            </div>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بإسم العميل..."
                  className="pr-10"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredClients.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between border-b pb-4"
                  >
                    <div>
                      <div className="font-medium flex items-center">
                        {client.name}
                        <span className="mr-2 px-2 py-0.5 text-xs rounded-full bg-muted">
                          {client.clientType}
                        </span>
                      </div>
                    </div>
                    <div className={`font-bold ${parseFloat(client.balance) > 0 ? 'text-primary' : 'text-destructive'}`}>
                      {parseFloat(client.balance) > 0 ? '+' : ''}{parseFloat(client.balance).toLocaleString()} جم
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                لا توجد عملاء أو موردين بأرصدة
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Inventory */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>المخزون</CardTitle>
                <CardDescription>كميات المنتجات المتوفرة</CardDescription>
              </div>
              <Link href="/inventory/products/new">
                <Button size="sm" className="h-8">
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة منتج
                </Button>
              </Link>
            </div>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بإسم المنتج..."
                  className="pr-10"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between border-b pb-4"
                  >
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        الكود: {product.code || "غير محدد"}
                      </div>
                    </div>
                    <div className={`font-bold ${parseFloat(product.currentStock) <= 0 ? 'text-destructive' : ''}`}>
                      {parseFloat(product.currentStock).toLocaleString()} {product.unit}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                لم يتم العثور على منتجات
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              تنبيه المخزون المنخفض
            </CardTitle>
            <CardDescription>
              المنتجات التي وصلت إلى الحد الأدنى للمخزون وتحتاج إلى إعادة طلب
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.lowStockProducts.map((product) => (
                <Card key={product.id} className="border-destructive/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          الكود: {product.code || "غير محدد"}
                        </div>
                      </div>
                      <div className="font-bold text-destructive">
                        متبقي: {product.currentStock} {product.unit}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Link href={`/purchases/invoices/new`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <Plus className="h-3 w-3 ml-1" />
                          طلب شراء
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}