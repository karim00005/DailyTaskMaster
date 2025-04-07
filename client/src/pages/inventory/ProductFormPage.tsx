import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { Loader2, ArrowRight, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product, insertProductSchema, Warehouse } from "@shared/schema";

// Extend the product schema for the form with validation
const formSchema = insertProductSchema.extend({
  code: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  buyPrice: z.string().min(1, "سعر الشراء مطلوب"),
  sellPrice: z.string().min(1, "سعر البيع مطلوب"),
  minStock: z.number().min(0, "الحد الأدنى للمخزون يجب أن يكون 0 أو أكثر"),
  currentStock: z.string().min(1, "المخزون الحالي مطلوب"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = Boolean(id);

  // Fetch product data if in edit mode
  const { data: product, isLoading: isLoadingProduct } = useQuery<Product>({
    queryKey: ["/api/products", id],
    queryFn: async () => {
      if (!id) return undefined;
      const res = await apiRequest("GET", `/api/products/${id}`);
      return await res.json();
    },
    enabled: isEditMode,
  });

  // Fetch warehouses for warehouse selection
  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      category: "",
      description: "",
      buyPrice: "0",
      sellPrice: "0",
      unit: "قطعة",
      minStock: 1,
      currentStock: "0",
      isActive: true,
    },
  });

  // Update form with product data when it's loaded
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        code: product.code || "",
        category: product.category || "",
        description: product.description || "",
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        unit: product.unit,
        minStock: product.minStock || 1,
        currentStock: product.currentStock,
        isActive: product.isActive,
      });
    }
  }, [product, form]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (isEditMode) {
        // Update existing product
        return apiRequest("PATCH", `/api/products/${id}`, data).then(res => res.json());
      } else {
        // Create new product
        return apiRequest("POST", "/api/products", data).then(res => res.json());
      }
    },
    onSuccess: () => {
      // Invalidate queries and show success message
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      toast({
        title: isEditMode ? "تم تحديث المنتج بنجاح" : "تم إضافة المنتج بنجاح",
        variant: "default",
      });
      
      // Navigate back to products list
      navigate("/inventory/products");
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
  if (isEditMode && isLoadingProduct) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href="/inventory/products">
          <Button variant="outline" size="icon" className="ml-2">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {isEditMode ? "تعديل منتج" : "إضافة منتج جديد"}
        </h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>بيانات المنتج</CardTitle>
          <CardDescription>
            أدخل معلومات المنتج التفصيلية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المنتج *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم المنتج" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كود المنتج</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل كود المنتج" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التصنيف</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل تصنيف المنتج" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="buyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سعر الشراء *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0" 
                          placeholder="أدخل سعر الشراء" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sellPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سعر البيع *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0" 
                          placeholder="أدخل سعر البيع" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وحدة القياس *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر وحدة القياس" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="قطعة">قطعة</SelectItem>
                        <SelectItem value="كيلو">كيلو</SelectItem>
                        <SelectItem value="متر">متر</SelectItem>
                        <SelectItem value="لتر">لتر</SelectItem>
                        <SelectItem value="علبة">علبة</SelectItem>
                        <SelectItem value="كرتون">كرتون</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المخزون الحالي *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0" 
                          step="1"
                          placeholder="أدخل المخزون الحالي" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحد الأدنى للمخزون *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          step="1"
                          placeholder="أدخل الحد الأدنى" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
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
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="أدخل وصف المنتج" 
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">الحالة</FormLabel>
                      <FormDescription>
                        المنتج {field.value ? "نشط" : "غير نشط"} في النظام
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
                      حفظ
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