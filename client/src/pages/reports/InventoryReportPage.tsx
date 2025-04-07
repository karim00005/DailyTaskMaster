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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2, 
  Search, 
  FileDown, 
  Printer,
  AlertTriangle
} from "lucide-react";
import { Product, Warehouse } from "@shared/schema";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function InventoryReportPage() {
  // Search query
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter states
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("all"); // all, low, out

  // Fetch products
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch warehouses
  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  // Extract unique categories from products
  const categories = products 
    ? [...new Set(products.map(product => product.category).filter(Boolean))]
    : [];

  // Filter products based on search query and filters
  const filteredProducts = products?.filter(product => {
    // Filter by search query
    const matchesSearch = 
      !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by warehouse
    const matchesWarehouse = !selectedWarehouse || product.warehouseId.toString() === selectedWarehouse;
    
    // Filter by category
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    // Filter by stock level
    const matchesStock = 
      stockFilter === "all" ||
      (stockFilter === "low" && product.currentStock <= product.minStock) ||
      (stockFilter === "out" && product.currentStock === 0);
    
    return matchesSearch && matchesWarehouse && matchesCategory && matchesStock;
  });

  // Calculate summary statistics
  const totalProducts = filteredProducts?.length || 0;
  const totalStockValue = filteredProducts?.reduce(
    (sum, product) => sum + (product.currentStock * product.price), 
    0
  ) || 0;
  const lowStockProducts = filteredProducts?.filter(
    product => product.currentStock <= product.minStock
  ).length || 0;
  const outOfStockProducts = filteredProducts?.filter(
    product => product.currentStock === 0
  ).length || 0;

  // Generate warehouse distribution data for pie chart
  const warehouseDistribution = warehouses?.map(warehouse => {
    const productsInWarehouse = filteredProducts?.filter(
      product => product.warehouseId === warehouse.id
    ) || [];
    
    const stockValue = productsInWarehouse.reduce(
      (sum, product) => sum + (product.currentStock * product.price),
      0
    );
    
    return {
      name: warehouse.name,
      value: stockValue
    };
  }).filter(item => item.value > 0) || [];

  // Generate category distribution data for pie chart
  const categoryDistribution = categories.map(category => {
    const productsInCategory = filteredProducts?.filter(
      product => product.category === category
    ) || [];
    
    const stockValue = productsInCategory.reduce(
      (sum, product) => sum + (product.currentStock * product.price),
      0
    );
    
    return {
      name: category,
      value: stockValue
    };
  }).filter(item => item.value > 0) || [];

  // Loading state
  if (isLoadingProducts) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">تقرير المخزون</h1>
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

      {/* Filter Controls */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>تصفية البيانات</CardTitle>
          <CardDescription>
            قم بتعديل معايير البحث لعرض المنتجات المطلوبة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                className="pr-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger>
                <SelectValue placeholder="المخزن" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">كل المخازن</SelectItem>
                {warehouses?.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">كل التصنيفات</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter} className="md:col-span-2">
              <SelectTrigger>
                <SelectValue placeholder="حالة المخزون" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المنتجات</SelectItem>
                <SelectItem value="low">منتجات منخفضة المخزون</SelectItem>
                <SelectItem value="out">منتجات نفذت من المخزون</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              إجمالي عدد المنتجات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              قيمة المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStockValue.toLocaleString()} جم</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              منتجات منخفضة المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {lowStockProducts > 0 && <AlertTriangle className="h-5 w-5 text-amber-500 ml-1" />}
              {lowStockProducts}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              منتجات نفذت من المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {outOfStockProducts > 0 && <AlertTriangle className="h-5 w-5 text-red-500 ml-1" />}
              {outOfStockProducts}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Warehouse Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع المخزون حسب المخازن</CardTitle>
            <CardDescription>
              قيمة المخزون في كل مخزن
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {warehouseDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={warehouseDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {warehouseDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} جم`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  لا توجد بيانات كافية لعرض الرسم البياني
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع المخزون حسب التصنيفات</CardTitle>
            <CardDescription>
              قيمة المخزون في كل تصنيف
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {categoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} جم`} />
                    <Legend />
                  </PieChart>
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

      {/* Detailed Data */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المنتجات</CardTitle>
          <CardDescription>
            معلومات تفصيلية عن المنتجات المتوفرة في المخزون
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>المنتج</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>المخزن</TableHead>
                <TableHead>المخزون الحالي</TableHead>
                <TableHead>الحد الأدنى</TableHead>
                <TableHead>سعر الوحدة</TableHead>
                <TableHead>القيمة الإجمالية</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const warehouse = warehouses?.find(w => w.id === product.warehouseId);
                  const stockStatus = product.currentStock === 0 
                    ? "out" 
                    : product.currentStock <= product.minStock 
                      ? "low" 
                      : "normal";
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono">{product.code || "—"}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category || "—"}</TableCell>
                      <TableCell>{warehouse?.name || "—"}</TableCell>
                      <TableCell>{product.currentStock} {product.unit}</TableCell>
                      <TableCell>{product.minStock} {product.unit}</TableCell>
                      <TableCell>{product.price.toLocaleString()} جم</TableCell>
                      <TableCell>{(product.currentStock * product.price).toLocaleString()} جم</TableCell>
                      <TableCell>
                        {stockStatus === "out" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            نفذ من المخزون
                          </span>
                        ) : stockStatus === "low" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            منخفض
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            متوفر
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-32 text-muted-foreground">
                    لا توجد بيانات للعرض في النطاق المحدد
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}