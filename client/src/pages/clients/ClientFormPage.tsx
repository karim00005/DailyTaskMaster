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
import { Client, insertClientSchema } from "@shared/schema";

// Extend the client schema for the form with validation
const formSchema = insertClientSchema.extend({
  phone: z.string().optional(),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ClientFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = Boolean(id);

  // Fetch client data if in edit mode
  const { data: client, isLoading: isLoadingClient } = useQuery<Client>({
    queryKey: ["/api/clients", id],
    queryFn: async () => {
      if (!id) return undefined;
      const res = await apiRequest("GET", `/api/clients/${id}`);
      return await res.json();
    },
    enabled: isEditMode,
  });

  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      isActive: true,
      clientType: "عميل",
      taxId: "",
    },
  });

  // Update form with client data when it's loaded
  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
        isActive: client.isActive,
        clientType: client.clientType || "عميل",
        taxId: client.taxId || "",
      });
    }
  }, [client, form]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (isEditMode) {
        // Update existing client
        return apiRequest("PATCH", `/api/clients/${id}`, data).then(res => res.json());
      } else {
        // Create new client
        return apiRequest("POST", "/api/clients", data).then(res => res.json());
      }
    },
    onSuccess: () => {
      // Invalidate queries and show success message
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      toast({
        title: isEditMode ? "تم تحديث العميل بنجاح" : "تم إضافة العميل بنجاح",
        variant: "default",
      });
      
      // Navigate back to clients list
      navigate("/clients");
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
  if (isEditMode && isLoadingClient) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href="/clients">
          <Button variant="outline" size="icon" className="ml-2">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {isEditMode ? "تعديل عميل" : "إضافة عميل جديد"}
        </h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>بيانات العميل</CardTitle>
          <CardDescription>
            أدخل معلومات العميل الأساسية
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
                    <FormLabel>اسم العميل *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم العميل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الحساب</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع الحساب" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="عميل">عميل</SelectItem>
                          <SelectItem value="مورد">مورد</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرقم الضريبي</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل الرقم الضريبي" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل رقم الهاتف" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل البريد الإلكتروني" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان</FormLabel>
                    <FormControl>
                      <Textarea placeholder="أدخل العنوان" {...field} />
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
                        العميل {field.value ? "نشط" : "غير نشط"} في النظام
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