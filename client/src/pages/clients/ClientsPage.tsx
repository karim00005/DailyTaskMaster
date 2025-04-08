import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Loader2, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit,
  Trash,
  XCircle,
  CheckCircle,
  FileSpreadsheet,
  Upload,
  Download
} from "lucide-react";
import { Client } from "@shared/schema";
import ExcelImporter from "@/components/excel/ExcelImporter";
import ExcelExporter from "@/components/excel/ExcelExporter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all");

  const clientTemplate = [
    {
      name: "اسم العميل",
      clientType: "عميل",
      email: "example@example.com",
      phone: "01234567890",
      address: "العنوان",
      taxId: "123456789",
      isActive: true
    }
  ];
  
  const clientHeaders = ["name", "clientType", "email", "phone", "address", "taxId", "isActive"];
  
  const { data: clients, isLoading, error } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/clients");
        return await res.json();
      } catch (err) {
        console.error("Failed to fetch clients:", err);
        throw new Error(err instanceof Error ? err.message : "Failed to fetch clients");
      }
    },
    staleTime: 30000,
    cacheTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    suspense: true
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تحميل قائمة العملاء",
        variant: "destructive"
      });
    }
  }, [error]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    
    return clients.filter(client => {
      if (!client) return false;
      
      const matchesSearch = !searchQuery || 
        client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = 
        clientTypeFilter === "all" || 
        client.clientType === clientTypeFilter || 
        (!client.clientType && clientTypeFilter === "عميل");

      return matchesSearch && matchesType;
    });
  }, [clients, searchQuery, clientTypeFilter]);

  const importClientsMutation = useMutation({
    mutationFn: async (clientsData: any[]) => {
      const processedClients = clientsData.map(client => ({
        ...client,
        isActive: typeof client.isActive === 'string' 
          ? client.isActive.toLowerCase() === 'true' 
          : Boolean(client.isActive)
      }));
      
      const response = await apiRequest("POST", "/api/clients/import", processedClients);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "تم استيراد العملاء بنجاح",
        description: "تم تحديث قائمة العملاء",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل استيراد العملاء",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleClientDataImported = (data: any[]) => {
    importClientsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">العملاء</h1>
        <div className="flex gap-2">
          <ExcelExporter 
            data={clients || []} 
            filename="clients-list"
            buttonText="تصدير العملاء"
          />
          <Link href="/clients/new">
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              إضافة عميل
            </Button>
          </Link>
        </div>
      </div>
      <Tabs defaultValue="list" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="list">قائمة العملاء</TabsTrigger>
          <TabsTrigger value="import">استيراد من Excel</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>قائمة العملاء والموردين</CardTitle>
              <CardDescription>
                إدارة قائمة العملاء والموردين وتعديل معلوماتهم
              </CardDescription>
              <div className="flex items-center gap-4 pt-4">
                <div className="relative flex-1">
                  <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    className="pr-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="w-48">
                  <Select
                    value={clientTypeFilter}
                    onValueChange={setClientTypeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="نوع الحساب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="عميل">عملاء فقط</SelectItem>
                      <SelectItem value="مورد">موردين فقط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>نوع الحساب</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>حالة الدفع</TableHead>
                    <TableHead className="w-[80px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients && filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            client.clientType === "مورد" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                          }`}>
                            {client.clientType || "عميل"}
                          </div>
                        </TableCell>
                        <TableCell>{client.phone || "—"}</TableCell>
                        <TableCell>{client.email || "—"}</TableCell>
                        <TableCell>{client.address || "—"}</TableCell>
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
                        <TableCell>
                          {client.balance === 0 ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                              <span>مدفوع بالكامل</span>
                            </div>
                          ) : client.balance > 0 ? (
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 text-yellow-500 ml-1" />
                              <span>مدفوع جزئياً</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 text-red-500 ml-1" />
                              <span>غير مدفوع</span>
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
                              <Link href={`/clients/${client.id}`}>
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
                      <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                        {clientTypeFilter !== "all" 
                          ? `لا يوجد ${clientTypeFilter === "عميل" ? "عملاء" : "موردين"} مطابقين للبحث` 
                          : searchQuery 
                            ? "لا توجد نتائج تطابق البحث" 
                            : "لا يوجد عملاء أو موردين بعد"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>استيراد العملاء من Excel</CardTitle>
              <CardDescription>
                قم بتنزيل قالب Excel فارغ، ثم تعبئته واستيراده مرة أخرى
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExcelImporter
                templateData={clientTemplate}
                templateFilename="clients-template"
                templateHeaders={clientHeaders}
                onDataImported={handleClientDataImported}
                placeholderText="اسحب وأفلت ملف قائمة العملاء هنا، أو انقر للتصفح"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}