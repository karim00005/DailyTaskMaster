import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from "@/components/ui/table";
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
  return `PUR-${year}${month}${day}-${random}`;
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
    required_error: "يجب اختيار المورد",
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
});

type FormValues = z.infer<typeof formSchema>;
type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;

export default function PurchasesInvoiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = Boolean(id);
  const [activeTab, setActiveTab] = useState("details");
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

  // Fetch clients for dropdown
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch products for dropdown
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "purchase",
      invoiceNumber: generateInvoiceNumber(),
      clientId: 0,
      clientName: "",
      date: new Date(),
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
        type: "purchase",
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        clientName: invoice.clientName || "",
        date: new Date(invoice.date),
        dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
        subtotal: invoice.subtotal,
        discount: invoice.discount || 0,
        tax: invoice.tax || 0,
        total: invoice.total,
        paid: invoice.paid || 0,
        notes: invoice.notes || "",
        items: invoice.items.map(item => ({
          id: item.id,
          invoiceId: item.invoiceId,
          productId: item.productId,
          productName: item.productName || "",
          quantity: item.quantity,
          price: item.price,
          total: item.total,
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
      setProductPrice(selectedProduct.price || 0);
    }
  }, [selectedProduct]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (isEditMode) {
        // Update existing invoice
        return apiRequest("PATCH", `/api/invoices/${id}`, data).then(res => res.json());
      } else {
        // Create new invoice
        return apiRequest("POST", "/api/invoices", data).then(res => res.json());
      }
    },
    onSuccess: () => {
      // Invalidate queries and show success message
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      toast({
        title: isEditMode ? "تم تحديث الفاتورة بنجاح" : "تم إنشاء الفاتورة بنجاح",
        variant: "default",
      });
      
      // Navigate back to invoices list
      navigate("/purchases/invoices");
    },
    onError: (error) => {
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
      navigate("/purchases/invoices");
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
    mutation.mutate(values);
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
          <Link href="/purchases/invoices">
            <Button variant="outline" size="icon" className="ml-2">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {isEditMode ? "تعديل فاتورة شراء" : "إنشاء فاتورة شراء جديدة"}
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
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="details">تفاصيل الفاتورة</TabsTrigger>
              <TabsTrigger value="items">المنتجات</TabsTrigger>
              <TabsTrigger value="payment">الدفع والملاحظات</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>معلومات الفاتورة الأساسية</CardTitle>
                  <CardDescription>
                    أدخل بيانات الفاتورة والمورد
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الفاتورة *</FormLabel>
                          <FormControl>
                            <Input placeholder="رقم الفاتورة" {...field} />
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
                          <FormLabel>المورد *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر المورد" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients?.map(client => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>تاريخ الفاتورة *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className="w-full pr-3 text-right font-normal"
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
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>تاريخ الاستحقاق</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className="w-full pr-3 text-right font-normal"
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
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("items")}>
                    إلغاء
                  </Button>
                  <Button onClick={() => setActiveTab("items")}>
                    التالي: المنتجات
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="items">
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
                          <Select 
                            onValueChange={(value) => {
                              const product = products?.find(p => p.id === parseInt(value));
                              setSelectedProduct(product || null);
                            }}
                            value={selectedProduct?.id?.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المنتج" />
                            </SelectTrigger>
                            <SelectContent>
                              {products?.map(product => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-2 font-bold">
                      <div>الإجمالي:</div>
                      <div className="text-left">
                        <input
                          type="hidden"
                          {...form.register("total", { valueAsNumber: true })}
                        />
                        {form.getValues("total")?.toLocaleString()} جم
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("details")}>
                    السابق: التفاصيل
                  </Button>
                  <Button onClick={() => setActiveTab("payment")}>
                    التالي: الدفع والملاحظات
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>معلومات الدفع والملاحظات</CardTitle>
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
                        <FormLabel>المبلغ المدفوع</FormLabel>
                        <FormControl>
                          <Input 
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
                        <FormLabel>ملاحظات</FormLabel>
                        <FormControl>
                          <Input placeholder="ملاحظات إضافية حول الفاتورة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("items")}>
                    السابق: المنتجات
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 ml-2" />
                        حفظ الفاتورة
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الفاتورة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الفاتورة وجميع بنودها بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}