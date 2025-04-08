import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription,
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Loader2, 
  ArrowRight, 
  Save, 
  CalendarIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Client, 
  Invoice,
  Transaction, 
  insertTransactionSchema
} from "@shared/schema";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Combobox } from "@/components/ui/combobox";
import { getClientBalance } from "@/lib/clientUtils";

// Extend the transaction schema for form validation
const formSchema = insertTransactionSchema.extend({
  description: z.string().min(1, "يجب إدخال وصف للمعاملة"),
  amount: z.number().min(0.01, "يجب أن يكون المبلغ أكبر من صفر"),
  paymentMethod: z.string().min(1, "يجب اختيار طريقة الدفع"),
  date: z.date(),
  clientName: z.string().optional(),
  type: z.enum(["income", "expense"]),
}).omit({ transactionNumber: true });

type FormValues = z.infer<typeof formSchema>;

export default function TransactionFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = Boolean(id);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [month, setMonth] = useState<Date>(new Date());
  const [clientBalance, setClientBalance] = useState("0");

  // Fetch transaction data if in edit mode
  const { data: transaction, isLoading: isLoadingTransaction } = useQuery<Transaction>({
    queryKey: ["/api/transactions", id],
    queryFn: async () => {
      if (!id) return undefined;
      const res = await apiRequest("GET", `/api/transactions/${id}`);
      return await res.json();
    },
    enabled: isEditMode,
  });

  // Fetch clients with proper error handling
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      const data = await res.json();
      console.log("Fetched clients:", data); // Debug log
      return data;
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch invoices for dropdown
  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Filter clients based on search
  const filteredClients = clients?.filter(client => 
    clientSearch === "" || 
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  ) || [];

  // Transform clients for combobox with proper handling
  const clientOptions = useMemo(() => {
    const options = clients?.map(client => ({
      value: client.id.toString(),
      label: `${client.name}${client.phone ? ` - ${client.phone}` : ''}`
    })) || [];

    console.log("Transformed client options:", options); // Debug log

    options.unshift({
      value: "none",
      label: "-- بدون عميل --"
    });

    return options;
  }, [clients]);

  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "دفعة من الحساب",
      amount: 0,
      type: "income",
      paymentMethod: "bank",
      date: new Date(),
      clientId: undefined,
      clientName: "",
      notes: "",
      transactionType: "صرف", // Add this
    },
  });

  // Update form with transaction data when it's loaded
  useEffect(() => {
    if (transaction) {
      form.reset({
        ...transaction,
        date: new Date(transaction.date),
        amount: typeof transaction.amount === "string" ? parseFloat(transaction.amount) : transaction.amount,
        clientId: transaction.clientId || undefined,
        invoiceId: transaction.invoiceId || undefined,
        description: transaction.description || "",
        type: transaction.type as "income" | "expense",
      });
    }
  }, [transaction, form]);

  // Update client name when client is selected
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "clientId") {
        const clientId = form.getValues("clientId");
        if (clientId === undefined || clientId === null) {
          form.setValue("clientName", "", { shouldValidate: true });
          return;
        }
        const client = clients?.find(c => c.id === Number(clientId));
        if (client) {
          form.setValue("clientName", client.name, { shouldValidate: true });
        }
      }
      
      if (name === "invoiceId") {
        const invoiceId = form.getValues("invoiceId");
        if (!invoiceId || invoiceId === "none") {
          form.setValue("invoiceId", undefined, { shouldValidate: true });
          form.setValue("referenceNumber", "", { shouldValidate: true });
          return;
        }
        const invoice = invoices?.find(i => i.id === Number(invoiceId));
        if (invoice) {
          form.setValue("referenceNumber", invoice.invoiceNumber, { shouldValidate: true });
          form.setValue("clientId", invoice.clientId, { shouldValidate: true });
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, clients, invoices]);

  // Update effect to fetch client balance
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "clientId") {
        const clientId = form.getValues("clientId");
        if (clientId) {
          getClientBalance(clientId).then(balance => {
            setClientBalance(balance);
          });
        } else {
          setClientBalance("0");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (isEditMode) {
        // Update existing transaction
        return apiRequest("PATCH", `/api/transactions/${id}`, data).then(res => res.json());
      } else {
        // Create new transaction
        return apiRequest("POST", "/api/transactions", data).then(res => res.json());
      }
    },
    onSuccess: () => {
      // Invalidate queries and show success message
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: isEditMode ? "تم تحديث المعاملة بنجاح" : "تم إضافة المعاملة بنجاح",
        variant: "default",
      });
      
      // Navigate back to transactions list
      navigate("/treasury/transactions");
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/transactions/${id}`).then(res => res.json());
    },
    onSuccess: () => {
      // Invalidate queries and show success message
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "تم حذف المعاملة بنجاح",
        variant: "default",
      });
      
      // Navigate back to transactions list
      navigate("/treasury/transactions");
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Submitting values:", values); // Debug log
      
      // Prepare the data
      const submitData = {
        ...values,
        date: format(values.date, "yyyy-MM-dd"),
        type: values.type === "income" ? "income" : "expense",
        transactionType: values.type === "income" ? "قبض" : "صرف",
        clientId: values.clientId ? Number(values.clientId) : null,
        amount: values.amount.toString(), // Ensure amount is string
      };

      console.log("Submitting data:", submitData); // Debug log
      await mutation.mutateAsync(submitData);
    } catch (error) {
      console.error('Transaction save error:', error);
      toast({
        title: "حدث خطأ",
        description: error instanceof Error ? error.message : "خطأ غير معروف",
        variant: "destructive",
      });
    }
  };

  // Add copy balance button handler
  const copyBalanceToAmount = () => {
    form.setValue("amount", Math.abs(parseFloat(clientBalance)), { 
      shouldValidate: true 
    });
  };

  // Add balance display and copy button
  const balanceSection = (
    <div className="flex items-center justify-between mt-2">
      <div className="text-sm">
        رصيد العميل: {parseFloat(clientBalance).toLocaleString()} جم
      </div>
      <Button
        type="button" 
        variant="outline"
        size="sm"
        onClick={copyBalanceToAmount}
      >
        نسخ المبلغ
      </Button>
    </div>
  );

  // Loading state
  if (isEditMode && isLoadingTransaction) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/treasury/transactions">
            <Button variant="outline" size="icon" className="ml-2">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {isEditMode ? "تعديل معاملة مالية" : "إضافة معاملة مالية جديدة"}
          </h1>
        </div>
        {isEditMode && (
          <Button 
            variant="destructive" 
            onClick={() => {
              if (confirm("هل أنت متأكد من حذف هذه المعاملة؟")) {
                deleteMutation.mutate();
              }
            }}
          >
            حذف المعاملة
          </Button>
        )}
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>بيانات المعاملة المالية</CardTitle>
          <CardDescription>
            أدخل بيانات المعاملة المالية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>نوع المعاملة *</FormLabel>
                    <FormDescription>
                      اختر نوع المعاملة (إيراد أو مصروف)
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        className="flex space-x-4 space-x-reverse"
                      >
                        <FormItem className="flex items-center space-x-2 space-x-reverse">
                          <FormControl>
                            <RadioGroupItem value="income" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <ArrowDownLeft className="h-4 w-4 text-green-600 ml-1" />
                            إيراد
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-x-reverse">
                          <FormControl>
                            <RadioGroupItem value="expense" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center">
                            <ArrowUpRight className="h-4 w-4 text-red-600 ml-1" />
                            مصروف
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المبلغ *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0" 
                          placeholder="أدخل المبلغ" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>التاريخ *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pr-3 text-right font-normal"
                              type="button" // Add this to prevent form submission
                            >
                              {field.value ? (
                                format(field.value, "yyyy/MM/dd", { locale: ar })
                              ) : (
                                <span>اختر التاريخ</span>
                              )}
                              <CalendarIcon className="mr-auto h-4 w-4" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date);
                                setMonth(date);
                              }
                            }}
                            month={month}
                            onMonthChange={setMonth}
                            initialFocus
                            locale={ar}
                            disabled={(date) => date > new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف *</FormLabel>
                    <FormControl>
                      <Input placeholder="وصف المعاملة المالية" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>طريقة الدفع *</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر طريقة الدفع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="bank">تحويل بنكي</SelectItem>
                        <SelectItem value="check">شيك</SelectItem>
                        <SelectItem value="card">بطاقة إئتمان</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العميل / المورد</FormLabel>
                      <FormControl>
                        <Combobox
                          options={clientOptions}
                          value={field.value?.toString() || "none"}
                          onChange={(value) => {
                            console.log("Selected client value:", value); // Debug log
                            if (value === "none") {
                              field.onChange(undefined);
                              form.setValue("clientName", "");
                            } else {
                              field.onChange(parseInt(value));
                              const client = clients?.find(c => c.id === parseInt(value));
                              console.log("Found client:", client); // Debug log
                              if (client) {
                                form.setValue("clientName", client.name);
                              }
                            }
                            setSelectedClientId(value);
                          }}
                          placeholder="اختر أو ابحث عن عميل..."
                          emptyMessage="لا يوجد عملاء مطابقين للبحث"
                          searchPlaceholder="ابحث باسم العميل..."
                        />
                      </FormControl>
                      <FormDescription>
                        {isLoadingClients ? "جاري تحميل العملاء..." : "العميل أو المورد المرتبط بالمعاملة (اختياري)"}
                      </FormDescription>
                      <FormMessage />
                      {balanceSection}
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="ملاحظات إضافية (اختياري)" 
                        className="resize-none"
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="px-0">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      حفظ المعاملة
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}