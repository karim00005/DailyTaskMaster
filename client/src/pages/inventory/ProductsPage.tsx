import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Loader2, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit,
  Trash,
  XCircle,
  CheckCircle
} from "lucide-react";
import { Product, Client } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: suppliers } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      const data = await res.json();
      // Filter to only get suppliers
      return data.filter((client: Client) => client.clientType === "مورد");
    }
  });

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const [productsRes, clientsRes] = await Promise.all([
        apiRequest("GET", "/api/products"),
        apiRequest("GET", "/api/clients")
      ]);

      const productsData = await productsRes.json();
      const clientsData = await clientsRes.json();
      
      // Filter clients to only get suppliers
      const suppliers = clientsData.filter((c: Client) => c.clientType === "مورد");

      return productsData.map((product: Product) => {
        const supplier = suppliers.find(s => s.id === product.supplierId);
        return {
          ...product,
          supplierName: supplier?.name || "غير محدد"
        };
      });
    },
    enabled: true, // Remove dependency on suppliers query
    retry: 1,
    staleTime: 1000,
    refetchOnWindowFocus: true
  });

  console.log("Raw products data:", products);

  const filteredProducts = products?.filter(product => {
    if (!product) return false;
    
    return product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           product.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           product.category?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  console.log("Filtered products:", filteredProducts);

  if (error) {
    console.error("Error loading products:", error);
    toast({
      title: "خطأ في تحميل البيانات",
      description: error instanceof Error ? error.message : "حدث خطأ أثناء تحميل قائمة المنتجات",
      variant: "destructive"
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">المنتجات</h1>
        <Link href="/inventory/products/new">
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إضافة منتج
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>قائمة المنتجات</CardTitle>
          <CardDescription>
            إدارة قائمة المنتجات في المخزون
          </CardDescription>
          <div className="flex items-center pt-4">
            <div className="relative flex-1">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                className="pr-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>المنتج</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-[80px]">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono">{product.code || "—"}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category || "—"}</TableCell>
                    <TableCell>{product.sellPrice} جم</TableCell>
                    <TableCell>
                      {parseInt(product.currentStock) < (product.minStock || 0) ? (
                        <span className="text-red-500 font-bold">{product.currentStock}</span>
                      ) : (
                        product.currentStock
                      )} {product.unit}
                    </TableCell>
                    <TableCell>
                      {product.isActive ? (
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/inventory/products/${product.id}`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 ml-2" />
                              <span>تعديل</span>
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem className="text-red-600">
                            <Trash className="h-4 w-4 ml-2" />
                            <span>حذف</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                    {searchQuery ? "لا توجد نتائج تطابق البحث" : "لا توجد منتجات بعد"}
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