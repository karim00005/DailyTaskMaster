import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Loader2, 
  ArrowRight, 
  Save, 
  Plus, 
  Trash, 
  CalendarIcon 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Client, 
  Product, 
  Invoice, 
  InvoiceItem, 
  insertInvoiceSchema, 
  insertInvoiceItemSchema 
} from "@shared/schema";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Helper to generate a new invoice number
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().substring(2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `INV-${year}${month}${day}-${random}`;
}

// Item schema for the form
const invoiceItemSchema = insertInvoiceItemSchema.extend({
  productId: z.number(),
  productName: z.string(),
  quantity: z.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
  price: z.number().min(0, "السعر يجب أن يكون أكبر من أو يساوي صفر"),
  total: z.number(),
});

// Main form schema
const formSchema = insertInvoiceSchema.extend({
  invoiceNumber: z.string().min(1, "رقم الفاتورة مطلوب"),
  clientId: z.number({
    required_error: "يجب اختيار العميل",
  }),
  clientName: z.string(),
  date: z.date(),
  dueDate: z.date().optional(),
  items: z.array(invoiceItemSchema).min(1, "يجب إضافة منتج واحد على الأقل"),
  subtotal: z.number(),
  discount: z.number().default(0),
  tax: z.number().default(0),
  total: z.number(),
  notes: z.string().optional(),
  paid: z.number().default(0),
  invoiceType: z.string().default("فاتورة بيع")
});

type FormValues = z.infer<typeof formSchema>;
type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;

export default function SalesInvoiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = Boolean(id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productPrice, setProductPrice] = useState(0);

  // Fetch invoice data if in edit mode
  const { data: invoice, isLoading: isLoadingInvoice } = useQuery<Invoice & { items: InvoiceItem[] }>({
    queryKey: ["/api/invoices", id],
    queryFn: async () => {
      if (!id) return undefined;
      const res = await apiRequest("GET", `/api/invoices/${id}`);
      return await res.json();
    },
    enabled: isEditMode,
  });

  // Fetch clients for dropdown (only clients, not suppliers)
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    select: (data) => data.filter(client => client.clientType === "عميل" || !client.clientType),
  });

  // Fetch products for dropdown
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: generateInvoiceNumber(),
      clientId: 0,
      clientName: "",
      date: new Date(),
      invoiceType: "فاتورة بيع",
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      paid: 0,
      notes: "",
    },
  });

  // Set up field array for invoice items
  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  // Helper to calculate totals based on items, discount, and tax
  const calculateTotals = () => {
    const items = form.getValues("items") || [];
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const discount = form.getValues("discount") || 0;
    const tax = form.getValues("tax") || 0;
    const total = subtotal - discount + tax;
    
    form.setValue("subtotal", subtotal);
    form.setValue("total", total);
    
    return { subtotal, total };
  };

  // Add a product to the invoice
  const addProduct = () => {
    if (!selectedProduct) return;
    
    const existingItemIndex = fields.findIndex(item => item.productId === selectedProduct.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const currentQty = form.getValues(`items.${existingItemIndex}.quantity`);
      const newQty = currentQty + productQuantity;
      form.setValue(`items.${existingItemIndex}.quantity`, newQty);
      form.setValue(`items.${existingItemIndex}.total`, newQty * productPrice);
    } else {
      // Add new item
      append({
        invoiceId: parseInt(id || "0"),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: productQuantity,
        price: productPrice,
        total: productQuantity * productPrice,
      });
    }
    
    // Reset product selection
    setSelectedProduct(null);
    setProductQuantity(1);
    setProductPrice(0);
    
    // Recalculate totals
    calculateTotals();
  };

  // Listen for tax or discount changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "tax" || name === "discount" || name?.startsWith("items")) {
        calculateTotals();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Update form with invoice data when it's loaded
  useEffect(() => {
    if (invoice && invoice.items) {
      form.reset({
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId || 0,
        clientName: "",
        date: new Date(invoice.date),
        subtotal: parseFloat(invoice.subTotal) || 0,
        discount: parseFloat(invoice.discount || "0") || 0,
        tax: parseFloat(invoice.tax || "0") || 0,
        total: parseFloat(invoice.total) || 0,
        paid: parseFloat(invoice.paid || "0") || 0,
        notes: invoice.notes || "",
        items: invoice.items.map(item => ({
          invoiceId: item.invoiceId || 0,
          productId: item.productId || 0,
          productName: "",
          quantity: parseFloat(item.quantity) || 0,
          price: parseFloat(item.price) || 0,
          total: parseFloat(item.total) || 0,
        })),
      });
    }
  }, [invoice, form]);

  // Update client name when client is selected
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "clientId") {
        const clientId = form.getValues("clientId");
        const client = clients?.find(c => c.id === clientId);
        if (client) {
          form.setValue("clientName", client.name);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch, clients]);

  // Update product price when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setProductPrice(parseFloat(selectedProduct.sellPrice) || 0);
    }
  }, [selectedProduct]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formattedData = {
        invoice: {
          invoiceNumber: data.invoiceNumber,
          clientId: data.clientId,
          date: format(data.date, "yyyy-MM-dd"),
          invoiceType: "فاتورة بيع", // نوع الفاتورة مبيعات
          status: "pending",
          paymentMethod: "cash",
          subTotal: data.subtotal.toString(),
          discount: data.discount.toString(),
          tax: data.tax.toString(),
          total: data.total.toString(),
          paid: data.paid.toString(),
          due: (data.total - (data.paid || 0)).toString(),
          notes: data.notes || ""
        },
        items: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity.toString(),
          price: item.price.toString(),
          total: (item.quantity * item.price).toString(),
          discount: "0",
          tax: "0"
        }))
      };

      console.log("Submitting invoice data:", formattedData);

      if (isEditMode) {
        // Update existing invoice
        return apiRequest("PATCH", `/api/invoices/${id}`, formattedData.invoice).then(res => res.json());
      } else {
        // Create new invoice
        return apiRequest("POST", "/api/invoices", formattedData).then(res => res.json());
      }
    },
    onSuccess: () => {
      // Invalidate both general and sales-specific queries
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", "sale"] });
      
      toast({
        title: isEditMode ? "تم تحديث الفاتورة بنجاح" : "تم إنشاء الفاتورة بنجاح",
        variant: "default",
      });
      
      // Navigate back to invoices list
      navigate("/sales/invoices");
    },
    onError: (error) => {
      console.error("Error saving invoice:", error);
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/invoices/${id}`).then(res => res.json());
    },
    onSuccess: () => {
      // Invalidate queries and show success message
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      toast({
        title: "تم حذف الفاتورة بنجاح",
        variant: "default",
      });
      
      // Navigate back to invoices list
      navigate("/sales/invoices");
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
  const onSubmit = (values: FormValues) => {
    console.log("Submit handler called."); // New log
    debugger; // Force debugger pause if DevTools is open
    console.log("onSubmit called with values:", values);
    
    // Convert date if necessary
    if (!(values.date instanceof Date)) {
      console.warn("Converting date from:", values.date);
      values.date = new Date(values.date);
    }
    
    // Ensure the date field is valid
    if (!values.date || isNaN(values.date.getTime())) {
      console.error("Invalid date value:", values.date);
      toast({
        title: "خطأ في البيانات",
        description: "يرجى اختيار تاريخ صالح.",
        variant: "destructive",
      });
      return;
    }
    
    // Proceed with submission
    mutation.mutate(values);
  };

  // Add an onError handler to log validation errors.
  const handleError = (errors: any) => {
    console.error("Validation errors:", errors);
  };

  // Loading state
  if (isEditMode && isLoadingInvoice) {
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
          <Link href="/sales/invoices">
            <Button variant="outline" size="icon" className="ml-2">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {isEditMode ? "تعديل فاتورة بيع" : "إنشاء فاتورة بيع جديدة"}
          </h1>
        </div>
        {isEditMode && (
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash className="h-4 w-4 ml-2" />
            حذف الفاتورة
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, handleError)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Invoice Details Section */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الفاتورة الأساسية</CardTitle>
                <CardDescription>
                  أدخل بيانات الفاتورة والعميل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="invoiceNumber">رقم الفاتورة *</FormLabel>
                        <FormControl>
                          {/* Added id and autoComplete */}
                          <Input id="invoiceNumber" autoComplete="on" placeholder="رقم الفاتورة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="clientId">العميل *</FormLabel>
                        <FormControl>
                          {/* Pass id here so that the underlying input has it */}
                          <Combobox
                            id="clientId"
                            options={clients?.map(client => ({
                              value: client.id.toString(),
                              label: client.name
                            })) || []}
                            value={field.value?.toString() || ""}
                            onChange={(value) => field.onChange(parseInt(value))}
                            placeholder="اختر العميل"
                            emptyMessage="لا يوجد عملاء مطابقين"
                            searchPlaceholder="ابحث عن عميل..."
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
                        <FormLabel htmlFor="date">تاريخ الفاتورة *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              {/* Added id to button for proper matching */}
                              <Button id="date" variant={"outline"} className="w-full pr-3 text-right font-normal">
                                {field.value ? format(field.value, "yyyy/MM/dd", { locale: ar }) : <span>اختر التاريخ</span>}
                                <CalendarIcon className="mr-auto h-4 w-4" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                                month={field.value}
                                onMonthChange={(newMonth) => {
                                  // Log month changes without updating the selected date
                                  console.log("Calendar month changed:", newMonth);
                                }}
                                selectedDate={field.value}
                                onDateSelect={(date) => {
                                  console.log("Calendar date selected:", date);
                                  field.onChange(date);
                                }}
                              />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment & Notes */}
            <Card>
              <CardHeader>
                <CardTitle>الدفع والملاحظات</CardTitle>
                <CardDescription>
                  أدخل معلومات الدفع وأي ملاحظات إضافية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="paid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="paid">المبلغ المدفوع</FormLabel>
                      <FormControl>
                        <Input 
                          id="paid"
                          autoComplete="on"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="أدخل المبلغ المدفوع" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        إجمالي الفاتورة: {form.getValues("total")?.toLocaleString()} جم
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="notes">ملاحظات</FormLabel>
                      <FormControl>
                        <Input 
                          id="notes"
                          autoComplete="on"
                          placeholder="ملاحظات إضافية حول الفاتورة" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Products Section */}
          <Card>
            <CardHeader>
              <CardTitle>المنتجات</CardTitle>
              <CardDescription>
                أضف المنتجات إلى الفاتورة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Product Form */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="product">المنتج</Label>
                      <Combobox
                        id="product"
                        options={products?.map(product => ({
                          value: product.id.toString(),
                          label: product.name
                        })) || []}
                        value={selectedProduct?.id?.toString() || ""}
                        onChange={(value) => {
                          const product = products?.find(p => p.id === parseInt(value));
                          setSelectedProduct(product || null);
                        }}
                        placeholder="اختر المنتج"
                        emptyMessage="لا توجد منتجات مطابقة"
                        searchPlaceholder="ابحث عن منتج..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">الكمية</Label>
                      <Input 
                        id="quantity"
                        type="number"
                        min="1"
                        value={productQuantity}
                        onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">السعر</Label>
                      <Input 
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={productPrice}
                        onChange={(e) => setProductPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <Button 
                      type="button"
                      onClick={addProduct} 
                      disabled={!selectedProduct}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Items Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.length > 0 ? (
                    fields.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <input
                            type="hidden"
                            {...form.register(`items.${index}.productId` as const)}
                          />
                          <input
                            type="hidden"
                            {...form.register(`items.${index}.productName` as const)}
                          />
                          {item.productName}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            className="w-20"
                            {...form.register(`items.${index}.quantity` as const, {
                              valueAsNumber: true,
                              onChange: (e) => {
                                const qty = parseInt(e.target.value) || 0;
                                const price = form.getValues(`items.${index}.price`);
                                form.setValue(`items.${index}.total`, qty * price);
                                calculateTotals();
                              },
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-28"
                            {...form.register(`items.${index}.price` as const, {
                              valueAsNumber: true,
                              onChange: (e) => {
                                const price = parseFloat(e.target.value) || 0;
                                const qty = form.getValues(`items.${index}.quantity`);
                                form.setValue(`items.${index}.total`, qty * price);
                                calculateTotals();
                              },
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="hidden"
                            {...form.register(`items.${index}.total` as const, {
                              valueAsNumber: true,
                            })}
                          />
                          {item.total?.toLocaleString()} جم
                        </TableCell>
                        <TableCell>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              remove(index);
                              calculateTotals();
                            }}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        لم يتم إضافة منتجات بعد
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="flex flex-col items-end space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-semibold">المجموع الفرعي:</div>
                  <div className="text-left">
                    <input
                      type="hidden"
                      {...form.register("subtotal", { valueAsNumber: true })}
                    />
                    {form.getValues("subtotal")?.toLocaleString()} جم
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-semibold">الخصم:</div>
                  <div className="text-left">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-28 h-7 text-xs"
                      {...form.register("discount", {
                        valueAsNumber: true,
                        onChange: () => calculateTotals(),
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-semibold">الضريبة:</div>
                  <div className="text-left">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-28 h-7 text-xs"
                      {...form.register("tax", {
                        valueAsNumber: true,
                        onChange: () => calculateTotals(),
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                  <div>الإجمالي:</div>
                  <div className="text-left">
                    <input
                      type="hidden"
                      {...form.register("total", { valueAsNumber: true })}
                    />
                    {form.getValues("total")?.toLocaleString()} جم
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-semibold">المدفوع:</div>
                  <div className="text-left">
                    {form.getValues("paid")?.toLocaleString()} جم
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm font-bold text-red-500">
                  <div>المتبقي:</div>
                  <div className="text-left">
                    {(form.getValues("total") - form.getValues("paid"))?.toLocaleString()} جم
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                type="submit" 
                onClick={() => console.log("Submit button clicked")} 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    {isEditMode ? "تحديث الفاتورة" : "حفظ الفاتورة"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الفاتورة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الفاتورة بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}