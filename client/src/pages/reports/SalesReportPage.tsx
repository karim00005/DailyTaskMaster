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
import { Separator } from "@/components/ui/separator";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
  CalendarIcon, 
  FileDown, 
  Printer 
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { Invoice, Client } from "@shared/schema";
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

// Helper functions
const generateDateRange = () => {
  const today = new Date();
  return {
    from: startOfMonth(today),
    to: today
  };
};

export default function SalesReportPage() {
  // Date range state
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to?: Date;
  }>(generateDateRange());

  // Client filter state
  const [selectedClient, setSelectedClient] = useState<string>("");

  // Fetch invoices (sales type only)
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const res = await fetch("/api/invoices?type=sale");
      return await res.json();
    },
  });

  // Fetch clients
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Filter invoices based on date range and selected client
  const filteredInvoices = invoices?.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    const isInDateRange = 
      (!dateRange.from || invoiceDate >= dateRange.from) &&
      (!dateRange.to || invoiceDate <= dateRange.to);
    
    const matchesClient = !selectedClient || invoice.clientId.toString() === selectedClient;
    
    return isInDateRange && matchesClient;
  });

  // Calculate summary statistics
  const totalSales = filteredInvoices?.reduce((sum, invoice) => sum + invoice.total, 0) || 0;
  const totalPaid = filteredInvoices?.reduce((sum, invoice) => sum + (invoice.paid || 0), 0) || 0;
  const totalDue = totalSales - totalPaid;
  const invoiceCount = filteredInvoices?.length || 0;
  
  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, "yyyy/MM/dd", { locale: ar });
  };

  // Generate chart data
  const chartData = filteredInvoices?.reduce((acc, invoice) => {
    const date = format(new Date(invoice.date), "MM/dd");
    
    const existingDay = acc.find(item => item.date === date);
    if (existingDay) {
      existingDay.total += invoice.total;
      existingDay.paid += invoice.paid || 0;
    } else {
      acc.push({
        date,
        total: invoice.total,
        paid: invoice.paid || 0,
      });
    }
    
    return acc;
  }, [] as { date: string; total: number; paid: number }[]) || [];

  // Loading state
  if (isLoadingInvoices) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">تقرير المبيعات</h1>
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
            قم بتعديل نطاق التاريخ والمعايير لعرض البيانات المطلوبة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-right w-full md:w-[300px]"
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                      </>
                    ) : (
                      formatDate(dateRange.from)
                    )
                  ) : (
                    <span>اختر نطاق التاريخ</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => setDateRange(range as { from: Date; to?: Date })}
                  initialFocus
                />
                <div className="flex items-center justify-between border-t p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange({ from: startOfMonth(new Date()), to: new Date() })}
                  >
                    هذا الشهر
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                  >
                    آخر 30 يوم
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="جميع العملاء" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع العملاء</SelectItem>
                {clients?.map(client => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
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
              إجمالي المدفوعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaid.toLocaleString()} جم</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              المبالغ المستحقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDue.toLocaleString()} جم</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              عدد الفواتير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>تحليل المبيعات</CardTitle>
          <CardDescription>
            المبيعات والمدفوعات على مدار الفترة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar name="إجمالي المبيعات" dataKey="total" fill="#3b82f6" />
                  <Bar name="المدفوعات" dataKey="paid" fill="#22c55e" />
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

      {/* Detailed Data */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل فواتير المبيعات</CardTitle>
          <CardDescription>
            قائمة تفصيلية بفواتير المبيعات خلال الفترة المحددة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>إجمالي الفاتورة</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>حالة الدفع</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices && filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{format(new Date(invoice.date), "yyyy/MM/dd", { locale: ar })}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{invoice.total.toLocaleString()} جم</TableCell>
                    <TableCell>{(invoice.paid || 0).toLocaleString()} جم</TableCell>
                    <TableCell>{(invoice.total - (invoice.paid || 0)).toLocaleString()} جم</TableCell>
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
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
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