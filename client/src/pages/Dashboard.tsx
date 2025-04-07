import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Package, FileText, DollarSign } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";

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

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/stats");
      return res.json();
    },
  });

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
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <div className="text-muted-foreground">
          مرحباً، {user?.fullName} 👋
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              العملاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground ml-2" />
              <div className="text-2xl font-bold">{stats?.counts.clients}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              المنتجات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-5 w-5 text-muted-foreground ml-2" />
              <div className="text-2xl font-bold">{stats?.counts.products}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي المبيعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-muted-foreground ml-2" />
              <div className="text-2xl font-bold">
                {parseFloat(stats?.totals.sales || "0").toLocaleString()} جم
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي المشتريات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-muted-foreground ml-2" />
              <div className="text-2xl font-bold">
                {parseFloat(stats?.totals.purchases || "0").toLocaleString()} جم
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales & Low Stock Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>أحدث المبيعات</CardTitle>
            <CardDescription>آخر 5 فواتير بيع</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentSales && stats.recentSales.length > 0 ? (
              <div className="space-y-4">
                {stats.recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between border-b pb-4"
                  >
                    <div>
                      <div className="font-medium">{sale.invoiceNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(sale.date).toLocaleDateString("ar-EG")}
                      </div>
                    </div>
                    <div className="font-bold">
                      {parseFloat(sale.total).toLocaleString()} جم
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                لا توجد مبيعات حديثة
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المنتجات قليلة المخزون</CardTitle>
            <CardDescription>
              المنتجات التي وصلت إلى الحد الأدنى للمخزون
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.lowStockProducts.map((product) => (
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
                    <div className="font-bold text-red-500">
                      متبقي: {product.currentStock} {product.unit}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                لا توجد منتجات قليلة المخزون
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}