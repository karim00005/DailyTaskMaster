import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { 
  TabsList,
  TabsTrigger,
  Tabs,
  TabsContent
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Loader2, 
  Save, 
  Download, 
  Upload, 
  Info, 
  Users, 
  Settings, 
  Database,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings as SettingsType, Client, Product, Invoice, InvoiceItem, Transaction, User as UserType } from "@shared/schema";
import * as ExcelHelper from "@/lib/excel-helper";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// نموذج تحديث الاسم الكامل
function UserProfileNameForm() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const formSchema = z.object({
    fullName: z.string().min(3, {
      message: "يجب أن يكون الاسم الكامل على الأقل 3 أحرف",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.fullName || "",
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user) throw new Error("لم يتم تسجيل الدخول");
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "تم تحديث الاسم بنجاح",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في تحديث الاسم",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateUserMutation.mutate(values);
  }

  if (isLoading) {
    return <div className="flex items-center space-x-4"><Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم الكامل</FormLabel>
              <FormControl>
                <Input placeholder="أدخل الاسم الكامل" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={updateUserMutation.isPending}
        >
          {updateUserMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <User className="h-4 w-4 ml-2" />
              تحديث الاسم
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

// نموذج تغيير كلمة المرور
function UserPasswordChangeForm() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const formSchema = z.object({
    currentPassword: z.string().min(6, {
      message: "يجب أن تكون كلمة المرور الحالية على الأقل 6 أحرف",
    }),
    newPassword: z.string().min(6, {
      message: "يجب أن تكون كلمة المرور الجديدة على الأقل 6 أحرف",
    }),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user) throw new Error("لم يتم تسجيل الدخول");
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, {
        currentPassword: values.currentPassword,
        password: values.newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تغيير كلمة المرور بنجاح",
        variant: "default",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "خطأ في تغيير كلمة المرور",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updatePasswordMutation.mutate(values);
  }

  if (isLoading) {
    return <div className="flex items-center space-x-4"><Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>كلمة المرور الحالية</FormLabel>
              <FormControl>
                <Input type="password" placeholder="أدخل كلمة المرور الحالية" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>كلمة المرور الجديدة</FormLabel>
              <FormControl>
                <Input type="password" placeholder="أدخل كلمة المرور الجديدة" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تأكيد كلمة المرور</FormLabel>
              <FormControl>
                <Input type="password" placeholder="أدخل كلمة المرور الجديدة مرة أخرى" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={updatePasswordMutation.isPending}
        >
          {updatePasswordMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري التحديث...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 ml-2" />
              تغيير كلمة المرور
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch settings
  const { data: settings, isLoading } = useQuery<SettingsType>({
    queryKey: ["/api/settings"],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<SettingsType>) => {
      const res = await apiRequest("POST", "/api/settings", newSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "تم حفظ الإعدادات بنجاح",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Backup database mutation
  const backupDatabaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/settings/backup");
      return res.blob();
    },
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "تم إنشاء نسخة احتياطية بنجاح",
        variant: "default",
      });
      
      setIsBackupDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ في إنشاء نسخة احتياطية",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper to update a single setting
  const updateSetting = (key: keyof SettingsType, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
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
        <h1 className="text-3xl font-bold">الإعدادات</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general" className="flex items-center">
            <Settings className="h-4 w-4 ml-2" />
            عام
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center">
            <Info className="h-4 w-4 ml-2" />
            معلومات الشركة
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 ml-2" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center">
            <Database className="h-4 w-4 ml-2" />
            البيانات والنسخ الاحتياطي
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات العامة</CardTitle>
              <CardDescription>
                إعدادات عامة للنظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">العملة الافتراضية</Label>
                  <Input 
                    id="defaultCurrency"
                    value={settings?.defaultCurrency || "جنيه مصري"}
                    onChange={(e) => updateSetting("defaultCurrency", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">اللغة الافتراضية</Label>
                  <Input 
                    id="defaultLanguage" 
                    value={settings?.defaultLanguage || "العربية"}
                    onChange={(e) => updateSetting("defaultLanguage", e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableNotifications">تفعيل الإشعارات</Label>
                  <Switch 
                    id="enableNotifications"
                    checked={settings?.enableNotifications || false}
                    onCheckedChange={(checked) => updateSetting("enableNotifications", checked)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  تفعيل إشعارات النظام مثل تنبيهات المخزون المنخفض والفواتير المستحقة
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="darkMode">الوضع الليلي</Label>
                  <Switch 
                    id="darkMode"
                    checked={settings?.darkMode || false}
                    onCheckedChange={(checked) => updateSetting("darkMode", checked)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  تفعيل الوضع الليلي للنظام
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rtlMode">واجهة من اليمين لليسار</Label>
                  <Switch 
                    id="rtlMode"
                    checked={settings?.rtlMode !== false}
                    onCheckedChange={(checked) => updateSetting("rtlMode", checked)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  تفعيل وضع اللغة العربية (RTL)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Info */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الشركة</CardTitle>
              <CardDescription>
                معلومات الشركة التي ستظهر في الفواتير والتقارير
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">اسم الشركة</Label>
                  <Input 
                    id="companyName"
                    value={settings?.companyName || ""}
                    onChange={(e) => updateSetting("companyName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">الرقم الضريبي</Label>
                  <Input 
                    id="taxNumber"
                    value={settings?.taxNumber || ""}
                    onChange={(e) => updateSetting("taxNumber", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">عنوان الشركة</Label>
                <Input 
                  id="companyAddress"
                  value={settings?.companyAddress || ""}
                  onChange={(e) => updateSetting("companyAddress", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">رقم الهاتف</Label>
                  <Input 
                    id="companyPhone"
                    value={settings?.companyPhone || ""}
                    onChange={(e) => updateSetting("companyPhone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">البريد الإلكتروني</Label>
                  <Input 
                    id="companyEmail"
                    value={settings?.companyEmail || ""}
                    onChange={(e) => updateSetting("companyEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">الموقع الإلكتروني</Label>
                  <Input 
                    id="companyWebsite"
                    value={settings?.companyWebsite || ""}
                    onChange={(e) => updateSetting("companyWebsite", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNotes">ملاحظات الفاتورة الافتراضية</Label>
                <Input 
                  id="invoiceNotes"
                  value={settings?.invoiceNotes || ""}
                  onChange={(e) => updateSetting("invoiceNotes", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  ستظهر هذه الملاحظات في جميع الفواتير بشكل افتراضي
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="button" 
                onClick={() => updateSettingsMutation.mutate(settings || {})}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ المعلومات
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المستخدمين</CardTitle>
              <CardDescription>
                إضافة وتعديل وحذف مستخدمي النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">تحديث بيانات المستخدم الحالي</h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">تغيير الاسم</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <UserProfileNameForm />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">تغيير كلمة المرور</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <UserPasswordChangeForm />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Backup */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>البيانات والنسخ الاحتياطي</CardTitle>
              <CardDescription>
                إنشاء نسخة احتياطية واستعادة البيانات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* قوالب Excel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">قوالب اكسل</CardTitle>
                    <CardDescription>
                      تنزيل قوالب فارغة لاستيراد البيانات
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => ExcelHelper.downloadClientTemplate()}
                      >
                        <Download className="h-4 w-4 ml-2" />
                        قالب العملاء
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => ExcelHelper.downloadProductTemplate()}
                      >
                        <Download className="h-4 w-4 ml-2" />
                        قالب المنتجات
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* تصدير البيانات */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">تصدير البيانات إلى ملفات إكسل</CardTitle>
                    <CardDescription>
                      تصدير البيانات إلى ملفات إكسل للمراجعة أو النسخ الاحتياطي
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          apiRequest("GET", "/api/clients")
                            .then(res => res.json())
                            .then(clients => {
                              ExcelHelper.exportClientsToExcel(clients);
                              toast({
                                title: "تم التصدير بنجاح",
                                description: "تم تصدير بيانات العملاء إلى ملف اكسل",
                                variant: "default",
                              });
                            })
                            .catch(error => {
                              toast({
                                title: "خطأ في التصدير",
                                description: error.message,
                                variant: "destructive",
                              });
                            });
                        }}
                      >
                        <Download className="h-4 w-4 ml-2" />
                        تصدير العملاء
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          apiRequest("GET", "/api/products")
                            .then(res => res.json())
                            .then(products => {
                              ExcelHelper.exportProductsToExcel(products);
                              toast({
                                title: "تم التصدير بنجاح",
                                description: "تم تصدير بيانات المنتجات إلى ملف اكسل",
                                variant: "default",
                              });
                            })
                            .catch(error => {
                              toast({
                                title: "خطأ في التصدير",
                                description: error.message,
                                variant: "destructive",
                              });
                            });
                        }}
                      >
                        <Download className="h-4 w-4 ml-2" />
                        تصدير المنتجات
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* استيراد البيانات */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">استيراد البيانات من ملفات إكسل</CardTitle>
                    <CardDescription>
                      استيراد البيانات من ملفات إكسل لإضافتها إلى النظام
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="import-clients">استيراد العملاء</Label>
                        <input
                          id="import-clients"
                          type="file"
                          accept=".xlsx"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              ExcelHelper.importClientsFromExcel(file)
                                .then(clients => {
                                  toast({
                                    title: "تم الاستيراد بنجاح",
                                    description: `تم استيراد ${clients.length} عميل بنجاح`,
                                    variant: "default",
                                  });
                                  // إعادة تعيين حقل الإدخال
                                  e.target.value = '';
                                })
                                .catch(error => {
                                  toast({
                                    title: "خطأ في الاستيراد",
                                    description: error.message,
                                    variant: "destructive",
                                  });
                                  // إعادة تعيين حقل الإدخال
                                  e.target.value = '';
                                });
                            }
                          }}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => document.getElementById('import-clients')?.click()}
                        >
                          <Upload className="h-4 w-4 ml-2" />
                          استيراد العملاء
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="import-products">استيراد المنتجات</Label>
                        <input
                          id="import-products"
                          type="file"
                          accept=".xlsx"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              ExcelHelper.importProductsFromExcel(file)
                                .then(products => {
                                  toast({
                                    title: "تم الاستيراد بنجاح",
                                    description: `تم استيراد ${products.length} منتج بنجاح`,
                                    variant: "default",
                                  });
                                  // إعادة تعيين حقل الإدخال
                                  e.target.value = '';
                                })
                                .catch(error => {
                                  toast({
                                    title: "خطأ في الاستيراد",
                                    description: error.message,
                                    variant: "destructive",
                                  });
                                  // إعادة تعيين حقل الإدخال
                                  e.target.value = '';
                                });
                            }
                          }}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => document.getElementById('import-products')?.click()}
                        >
                          <Upload className="h-4 w-4 ml-2" />
                          استيراد المنتجات
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* نسخة احتياطية كاملة */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">نسخة احتياطية</CardTitle>
                    <CardDescription>
                      إنشاء نسخة احتياطية من بيانات النظام
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      قم بإنشاء نسخة احتياطية كاملة من قاعدة البيانات، بما في ذلك المنتجات والعملاء والفواتير والإعدادات.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          Promise.all([
                            apiRequest("GET", "/api/clients").then(res => res.json()),
                            apiRequest("GET", "/api/products").then(res => res.json()),
                            apiRequest("GET", "/api/invoices").then(res => res.json()),
                            apiRequest("GET", "/api/invoices/1/items").then(res => res.json()), // يجب تعديل هذا للحصول على جميع عناصر الفواتير
                            apiRequest("GET", "/api/transactions").then(res => res.json())
                          ])
                          .then(([clients, products, invoices, invoiceItems, transactions]) => {
                            ExcelHelper.exportFullBackup(clients, products, invoices, invoiceItems, transactions);
                            toast({
                              title: "تم التصدير بنجاح",
                              description: "تم إنشاء نسخة احتياطية كاملة بتنسيق Excel",
                              variant: "default",
                            });
                          })
                          .catch(error => {
                            toast({
                              title: "خطأ في إنشاء النسخة الاحتياطية",
                              description: error.message,
                              variant: "destructive",
                            });
                          });
                        }}
                      >
                        <Download className="h-4 w-4 ml-2" />
                        نسخة Excel
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setIsBackupDialogOpen(true)}
                      >
                        <Download className="h-4 w-4 ml-2" />
                        نسخة JSON
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* استعادة النسخة الاحتياطية */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">استعادة البيانات</CardTitle>
                    <CardDescription>
                      استعادة البيانات من نسخة احتياطية
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      قم باستعادة بيانات النظام من نسخة احتياطية سابقة. سيتم استبدال جميع البيانات الحالية.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="import-backup">استعادة من Excel</Label>
                        <input
                          id="import-backup"
                          type="file"
                          accept=".xlsx"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              ExcelHelper.importFullBackup(file)
                                .then(result => {
                                  toast({
                                    title: "تم الاستيراد بنجاح",
                                    description: "تم استعادة البيانات بنجاح",
                                    variant: "default",
                                  });
                                  // إعادة تعيين حقل الإدخال
                                  e.target.value = '';
                                })
                                .catch(error => {
                                  toast({
                                    title: "خطأ في الاستيراد",
                                    description: error.message,
                                    variant: "destructive",
                                  });
                                  // إعادة تعيين حقل الإدخال
                                  e.target.value = '';
                                });
                            }
                          }}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => document.getElementById('import-backup')?.click()}
                        >
                          <Upload className="h-4 w-4 ml-2" />
                          استعادة من Excel
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setIsRestoreDialogOpen(true)}
                      >
                        <Upload className="h-4 w-4 ml-2" />
                        استعادة من JSON
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoBackup">النسخ الاحتياطي التلقائي</Label>
                  <Switch 
                    id="autoBackup"
                    checked={settings?.autoBackup || false}
                    onCheckedChange={(checked) => updateSetting("autoBackup", checked)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  إنشاء نسخة احتياطية تلقائية بشكل دوري
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Backup Confirmation Dialog */}
      <AlertDialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إنشاء نسخة احتياطية</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في إنشاء نسخة احتياطية كاملة للنظام؟ سيتم تنزيل ملف يحتوي على جميع البيانات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => backupDatabaseMutation.mutate()}
              disabled={backupDatabaseMutation.isPending}
            >
              {backupDatabaseMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء نسخة احتياطية"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>استعادة البيانات</AlertDialogTitle>
            <AlertDialogDescription>
              هذه الميزة قيد التطوير حالياً. سيتم إضافة وظيفة استعادة البيانات قريباً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsRestoreDialogOpen(false)}>
              حسناً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}