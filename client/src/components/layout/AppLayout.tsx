import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BarChart3,
  Home,
  Package,
  ShoppingCart,
  Users,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  User,
  Menu,
  ChevronDown,
} from "lucide-react";
import { ThemeToggle, RtlToggle } from "@/components/ui/theme-toggle";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  submenu?: { label: string; href: string }[];
};

export function AppLayout({ children }: AppLayoutProps) {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

  const navItems: NavItem[] = [
    {
      label: "الرئيسية",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: "العملاء",
      href: "/clients",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "المخزون",
      href: "/inventory",
      icon: <Package className="h-5 w-5" />,
      submenu: [
        { label: "المنتجات", href: "/inventory/products" },
        { label: "المخازن", href: "/inventory/warehouses" },
      ],
    },
    {
      label: "المبيعات",
      href: "/sales",
      icon: <ShoppingCart className="h-5 w-5" />,
      submenu: [
        { label: "فواتير البيع", href: "/sales/invoices" },
        { label: "إنشاء فاتورة بيع", href: "/sales/invoices/new" },
      ],
    },
    {
      label: "المشتريات",
      href: "/purchases",
      icon: <ShoppingCart className="h-5 w-5" />,
      submenu: [
        { label: "فواتير الشراء", href: "/purchases/invoices" },
        { label: "إنشاء فاتورة شراء", href: "/purchases/invoices/new" },
      ],
    },
    {
      label: "الحسابات",
      href: "/treasury",
      icon: <DollarSign className="h-5 w-5" />,
      submenu: [
        { label: "المعاملات المالية", href: "/treasury/transactions" },
        { label: "إنشاء معاملة", href: "/treasury/transactions/new" },
      ],
    },
    {
      label: "التقارير",
      href: "/reports",
      icon: <FileText className="h-5 w-5" />,
      submenu: [
        { label: "تقارير المبيعات", href: "/reports/sales" },
        { label: "تقارير المشتريات", href: "/reports/purchases" },
        { label: "تقارير المخزون", href: "/reports/inventory" },
        { label: "تقارير العملاء", href: "/reports/clients" },
      ],
    },
    {
      label: "الإعدادات",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      adminOnly: true,
    },
  ];

  const toggleSubmenu = (label: string) => {
    if (openSubmenu === label) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu(label);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const renderNavItems = () => {
    return navItems.map((item) => {
      // Skip admin-only items for non-admin users
      if (item.adminOnly && user?.role !== "admin") return null;

      if (item.submenu) {
        return (
          <div key={item.label} className="w-full">
            <button
              onClick={() => toggleSubmenu(item.label)}
              className={`flex items-center justify-between w-full px-4 py-2 rounded-md ${
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <div className="flex items-center">
                {item.icon}
                <span className="mr-2">{item.label}</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  openSubmenu === item.label ? "transform rotate-180" : ""
                }`}
              />
            </button>
            {openSubmenu === item.label && (
              <div className="mr-4 mt-1 border-r pr-4 py-1">
                {item.submenu.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={`block px-4 py-2 text-sm rounded-md ${
                      location === subItem.href
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      }

      return (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center px-4 py-2 rounded-md ${
            isActive(item.href)
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          {item.icon}
          <span className="mr-2">{item.label}</span>
        </Link>
      );
    });
  };

  // Sidebar content used in both desktop and mobile views
  const sidebarContent = (
    <div className="h-full flex flex-col space-y-4">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-center">نظام إدارة المبيعات</h1>
      </div>
      <div className="flex-1 py-2 overflow-auto">
        <nav className="space-y-1 px-2">{renderNavItems()}</nav>
      </div>
      <div className="p-4 border-t mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              {user?.fullName?.[0] || <User className="h-4 w-4" />}
            </div>
            <div className="mr-2">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <ThemeToggle />
            <RtlToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="تسجيل الخروج"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar - Now using Sheet like mobile */}
      {!isMobile && (
        <Sheet>
          <SheetTrigger asChild className="block md:absolute md:top-4 md:right-4 md:z-10">
            <Button variant="outline" size="icon" className="ml-4 mt-4">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-80">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header for all screens */}
        <header className="py-2 px-4 border-b flex items-center justify-between">
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-80">
                {sidebarContent}
              </SheetContent>
            </Sheet>
          ) : null}

          <h1 className="text-xl font-bold">نظام إدارة المبيعات</h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  {user?.fullName?.[0] || <User className="h-4 w-4" />}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="h-4 w-4 ml-2" />
                <span>{user?.fullName}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <div className="flex justify-between items-center cursor-default">
                  <div className="flex items-center">
                    <span className="mr-2">الوضع المظلم</span>
                  </div>
                  <ThemeToggle />
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <div className="flex justify-between items-center cursor-default">
                  <div className="flex items-center">
                    <span className="mr-2">اتجاه النص</span>
                  </div>
                  <RtlToggle />
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 ml-2" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}