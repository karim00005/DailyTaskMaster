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
import { Loader2, ArrowRight, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Warehouse, insertWarehouseSchema } from "@shared/schema";

// Extend the warehouse schema for the form with validation
const formSchema = insertWarehouseSchema.extend({
  location: z.string().optional(),
  manager: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function WarehouseFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = Boolean(id);

  // Fetch warehouse data if in edit mode
  const { data: warehouse, isLoading: isLoadingWarehouse } = useQuery<Warehouse>({
    queryKey: ["/api/warehouses", id],
    queryFn: async () => {
      if (!id) return undefined;
      const res = await apiRequest("GET", `/api/warehouses/${id}`);
      return await res.json();
    },
    enabled: isEditMode,
  });

  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      manager: "",
      notes: "",
      isDefault: false,
    },
  });

  // Update form with warehouse data when it's loaded
  useEffect(() => {
    if (warehouse) {
      form.reset({
        name: warehouse.name,
        location: warehouse.location || "",
        manager: warehouse.manager || "",
        notes: warehouse.notes || "",
        isDefault: warehouse.isDefault,
      });
    }
  }, [warehouse, form]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (isEditMode) {
        // Update existing warehouse
        return apiRequest("PATCH", `/api/warehouses/${id}`, data).then(res => res.json());
      } else {
        // Create new warehouse
        return apiRequest("POST", "/api/warehouses", data).then(res => res.json());
      }
    },
    onSuccess: () => {
      // Invalidate queries and show success message
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      
      toast({
        title: isEditMode ? "تم تحديث المخزن بنجاح" : "تم إضافة المخزن بنجاح",
        variant: "default",
      });
      
      // Navigate back to warehouses list
      navigate("/inventory/warehouses");
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
  if (isEditMode && isLoadingWarehouse) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href="/inventory/warehouses">
          <Button variant="outline" size="icon" className="ml-2">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {isEditMode ? "تعديل مخزن" : "إضافة مخزن جديد"}
        </h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>بيانات المخزن</CardTitle>
          <CardDescription>
            أدخل معلومات المخزن الأساسية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المخزن *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المخزن" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>موقع المخزن</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل موقع المخزن" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مسؤول المخزن</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم مسؤول المخزن" {...field} />
                    </FormControl>
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
                      <Textarea 
                        placeholder="أدخل ملاحظات عن المخزن" 
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
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">المخزن الافتراضي</FormLabel>
                      <FormDescription>
                        هذا هو المخزن الافتراضي الذي سيتم استخدامه للمنتجات الجديدة
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