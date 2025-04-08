import { useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
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
import { Invoice, Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent, 
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SalesInvoicesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", "sale"],
    queryFn: async () => {
      try {
        console.log("Fetching sales invoices...");
        const res = await apiRequest("GET", "/api/invoices?type=فاتورة بيع");
        if (!res.ok) {
          const errorText = await res.text();
          console.error("API error fetching invoices:", res.status, errorText);
          throw new Error(`API error: ${res.status} - ${errorText}`);
        }
        const data = await res.json();
        console.log("Fetched invoices:", data);
        
        // Join invoice data with client data
        const invoicesWithClientData = data.map((invoice: Invoice) => {
          const client = clients?.find(c => c.id === invoice.clientId);
          return {
            ...invoice,
            clientName: client?.name || "عميل غير معروف"
          };
        });
        
        return invoicesWithClientData;
      } catch (error: any) {
        console.error("Error fetching invoices:", error);
        toast({
          title: "حدث خطأ أثناء جلب الفواتير",
          description: error.message || "فشل جلب الفواتير",
          variant: "destructive",
        });
        throw error;
      }
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        const res = await apiRequest("DELETE", `/api/invoices/${id}`);
        if (!res.ok) {
          const errorText = await res.text();
          console.error("API error deleting invoice:", res.status, errorText);
          throw new Error(`API error: ${res.status} - ${errorText}`);
        }
        const data = await res.json();
        return data;
      } catch (error: any) {
        console.error("Delete error:", error);
        toast({
          title: "حدث خطأ أثناء حذف الفاتورة",
          description: error.message || "فشل حذف الفاتورة",
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      toast({
        title: "تم حذف الفاتورة بنجاح",
        variant: "default",
      });
      
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Delete mutation error:", error);
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل حذف الفاتورة",
        variant: "destructive",
      });
    }
  });

  // Handle invoice actions
  const handleView = (invoice: Invoice) => {
    window.open(`/api/invoices/${invoice.id}/view`, '_blank');
  };

  const handlePrint = (invoice: Invoice) => {
    window.open(`/api/invoices/${invoice.id}/print`, '_blank');
  };

  const handleExport = (invoice: Invoice) => {
    window.open(`/api/invoices/${invoice.id}/export`, '_blank');
  };

  const handleDelete = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">فواتير المبيعات</h1>
        <Link href="/sales/invoices/new">
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إنشاء فاتورة بيع
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>قائمة فواتير المبيعات</CardTitle>
          <CardDescription>
            إدارة فواتير البيع والمنتجات المباعة
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
                <TableHead>العميل</TableHead>
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
                          <Link href={`/sales/invoices/${invoice.id}`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 ml-2" />
                              <span>تعديل</span>
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onSelect={() => handleView(invoice)}>
                            <Eye className="h-4 w-4 ml-2" />
                            <span>عرض</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handlePrint(invoice)}>
                            <Printer className="h-4 w-4 ml-2" />
                            <span>طباعة</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleExport(invoice)}>
                            <FileDown className="h-4 w-4 ml-2" />
                            <span>تصدير PDF</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onSelect={() => handleDelete(invoice)}
                          >
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
                    {searchQuery ? "لا توجد نتائج تطابق البحث" : "لا توجد فواتير بيع بعد"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الفاتورة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الفاتورة وتحديث رصيد العميل تلقائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedInvoice && deleteMutation.mutate(selectedInvoice.id)}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "حذف"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}