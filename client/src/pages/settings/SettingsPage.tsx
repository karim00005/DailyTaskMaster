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
  Loader2, 
  Save, 
  Download, 
  Upload, 
  Info, 
  Users, 
  Settings, 
  Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings as SettingsType } from "@shared/schema";

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
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <Users className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-xl font-semibold">ميزة في التطوير</h3>
                <p className="text-muted-foreground">
                  سيتم إضافة ميزة إدارة المستخدمين قريباً
                </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsBackupDialogOpen(true)}
                    >
                      <Download className="h-4 w-4 ml-2" />
                      إنشاء نسخة احتياطية
                    </Button>
                  </CardContent>
                </Card>

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
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsRestoreDialogOpen(true)}
                    >
                      <Upload className="h-4 w-4 ml-2" />
                      استعادة البيانات
                    </Button>
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