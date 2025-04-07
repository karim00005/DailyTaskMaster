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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Client } from "@shared/schema";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all"); // "all", "عميل", "مورد"
  
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Filter clients based on search query and client type
  const filteredClients = clients?.filter(client => {
    // Apply search filter
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply client type filter
    const matchesType = 
      clientTypeFilter === "all" || 
      client.clientType === clientTypeFilter || 
      (!client.clientType && clientTypeFilter === "عميل"); // Default to client if not specified
    
    return matchesSearch && matchesType;
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">العملاء</h1>
        <Link href="/clients/new">
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إضافة عميل
          </Button>
        </Link>
      </div>

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
                  <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
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
    </div>
  );
}