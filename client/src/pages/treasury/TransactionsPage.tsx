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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Loader2, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit,
  Trash,
  ArrowRightLeft,
  CalendarIcon,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Transaction } from "@shared/schema";

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [transactionType, setTransactionType] = useState<string | null>(null);
  
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Filter transactions based on search query, date range, and type
  const filteredTransactions = transactions?.filter(transaction => {
    // Filter by search query (client name, invoice number, etc.)
    const matchesSearch = 
      !searchQuery || 
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by date range
    const transactionDate = transaction.date ? new Date(transaction.date) : null;
    const matchesDateRange = 
      (!dateRange.from || !transactionDate || transactionDate >= dateRange.from) &&
      (!dateRange.to || !transactionDate || transactionDate <= dateRange.to);
    
    // Filter by transaction type
    const matchesType = !transactionType || transaction.type === transactionType;
    
    return matchesSearch && matchesDateRange && matchesType;
  });

  // Calculate totals
  const totalIncome = filteredTransactions
    ?.filter(transaction => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
  
  const totalExpense = filteredTransactions
    ?.filter(transaction => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
  
  const netBalance = totalIncome - totalExpense;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "yyyy/MM/dd", { locale: ar });
  };

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
        <h1 className="text-3xl font-bold">المعاملات المالية</h1>
        <Link href="/treasury/transactions/new">
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إضافة معاملة
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700">الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowDownLeft className="h-5 w-5 text-green-600 ml-2" />
              <div className="text-2xl font-bold text-green-700">{totalIncome.toLocaleString()} جم</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700">المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowUpRight className="h-5 w-5 text-red-600 ml-2" />
              <div className="text-2xl font-bold text-red-700">{totalExpense.toLocaleString()} جم</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700">صافي الرصيد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowRightLeft className="h-5 w-5 text-blue-600 ml-2" />
              <div className="text-2xl font-bold text-blue-700">{netBalance.toLocaleString()} جم</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>سجل المعاملات المالية</CardTitle>
          <CardDescription>
            عرض وإدارة جميع المعاملات المالية
          </CardDescription>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                className="pr-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between min-w-[240px]">
                  {dateRange.from || dateRange.to ? (
                    <>
                      {dateRange.from ? format(dateRange.from, "yyyy/MM/dd", { locale: ar }) : ""}
                      {dateRange.to ? ` - ${format(dateRange.to, "yyyy/MM/dd", { locale: ar })}` : ""}
                    </>
                  ) : (
                    <span>اختر الفترة</span>
                  )}
                  <CalendarIcon className="mr-auto h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <select
              className="rounded-md border border-input px-3 py-2 min-w-[150px]"
              value={transactionType || ""}
              onChange={(e) => setTransactionType(e.target.value || null)}
            >
              <option value="">كل المعاملات</option>
              <option value="income">إيرادات</option>
              <option value="expense">مصروفات</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead className="w-[80px]">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions && filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>{transaction.clientName || "—"}</TableCell>
                    <TableCell>{transaction.referenceNumber || "—"}</TableCell>
                    <TableCell>{transaction.paymentMethod}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === "income" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {transaction.type === "income" ? "إيراد" : "مصروف"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                        {transaction.amount.toLocaleString()} جم
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/treasury/transactions/${transaction.id}`}>
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
                    {searchQuery || dateRange.from || dateRange.to || transactionType 
                      ? "لا توجد نتائج تطابق معايير البحث" 
                      : "لا توجد معاملات مالية بعد"}
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