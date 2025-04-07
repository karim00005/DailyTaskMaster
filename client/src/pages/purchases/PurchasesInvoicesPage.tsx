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
  Eye,
  Printer,
  FileDown,
} from "lucide-react";
import { Invoice } from "@shared/schema";

export default function PurchasesInvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      // Filter for purchase invoices only (type: "purchase")
      const res = await fetch("/api/invoices?type=purchase");
      return await res.json();
    },
  });

  // Filter invoices based on search query
  const filteredInvoices = invoices?.filter(invoice => 
    invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">فواتير المشتريات</h1>
        <Link href="/purchases/invoices/new">
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إنشاء فاتورة شراء
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>قائمة فواتير المشتريات</CardTitle>
          <CardDescription>
            إدارة فواتير الشراء والمنتجات المشتراة
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
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>حالة الدفع</TableHead>
                <TableHead className="w-[100px]">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices && filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{formatDate(invoice.date)}</TableCell>
                    <TableCell>{invoice.total?.toLocaleString()} جم</TableCell>
                    <TableCell>{invoice.paid?.toLocaleString()} جم</TableCell>
                    <TableCell>{(invoice.total - invoice.paid)?.toLocaleString()} جم</TableCell>
                    <TableCell>
                      {invoice.paid >= invoice.total ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          مدفوع بالكامل
                        </span>
                      ) : invoice.paid > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          مدفوع جزئياً
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          غير مدفوع
                        </span>
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
                          <Link href={`/purchases/invoices/${invoice.id}`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 ml-2" />
                              <span>تعديل</span>
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 ml-2" />
                            <span>عرض</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Printer className="h-4 w-4 ml-2" />
                            <span>طباعة</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileDown className="h-4 w-4 ml-2" />
                            <span>تصدير PDF</span>
                          </DropdownMenuItem>
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
                  <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                    {searchQuery ? "لا توجد نتائج تطابق البحث" : "لا توجد فواتير شراء بعد"}
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