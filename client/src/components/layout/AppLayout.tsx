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
  const [location] = useLocation();

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

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  // Render navigation items in the header
  const renderNavDropdowns = () => {
    return navItems.map((item) => {
      // Skip admin-only items for non-admin users
      if (item.adminOnly && user?.role !== "admin") return null;

      if (item.submenu) {
        return (
          <DropdownMenu key={item.label}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={isActive(item.href) ? "default" : "ghost"} 
                className="flex items-center gap-1"
              >
                {item.icon}
                <span className="mr-1">{item.label}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {item.submenu.map((subItem) => (
                <DropdownMenuItem key={subItem.href} asChild>
                  <Link 
                    href={subItem.href}
                    className={location === subItem.href ? "bg-primary/10 text-primary font-medium" : ""}
                  >
                    {subItem.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }

      return (
        <Link key={item.href} href={item.href}>
          <Button 
            variant={isActive(item.href) ? "default" : "ghost"} 
            className="flex items-center gap-1"
          >
            {item.icon}
            <span className="mr-1">{item.label}</span>
          </Button>
        </Link>
      );
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header for all devices */}
      <header className="py-2 px-4 border-b flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold ml-4">نظام إدارة المبيعات</h1>
        </div>
        
        <div className="flex-1 overflow-x-auto flex items-center justify-start px-2 gap-1 my-1">
          {renderNavDropdowns()}
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <RtlToggle />
          
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
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 ml-2" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}