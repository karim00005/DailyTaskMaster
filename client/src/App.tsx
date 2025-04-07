import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";

// Clients
import ClientsPage from "@/pages/clients/ClientsPage";
import ClientFormPage from "@/pages/clients/ClientFormPage";

// Inventory
import ProductsPage from "@/pages/inventory/ProductsPage";
import ProductFormPage from "@/pages/inventory/ProductFormPage";
import WarehousesPage from "@/pages/inventory/WarehousesPage";
import WarehouseFormPage from "@/pages/inventory/WarehouseFormPage";

// Sales
import SalesInvoicesPage from "@/pages/sales/SalesInvoicesPage";
import SalesInvoiceFormPage from "@/pages/sales/SalesInvoiceFormPage";

// Purchases
import PurchasesInvoicesPage from "@/pages/purchases/PurchasesInvoicesPage";
import PurchasesInvoiceFormPage from "@/pages/purchases/PurchasesInvoiceFormPage";

// Treasury
import TransactionsPage from "@/pages/treasury/TransactionsPage";
import TransactionFormPage from "@/pages/treasury/TransactionFormPage";

// Reports
import SalesReportPage from "@/pages/reports/SalesReportPage";
import PurchasesReportPage from "@/pages/reports/PurchasesReportPage";
import InventoryReportPage from "@/pages/reports/InventoryReportPage";
import ClientsReportPage from "@/pages/reports/ClientsReportPage";

// Settings
import SettingsPage from "@/pages/settings/SettingsPage";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Dashboard */}
      <ProtectedRoute path="/" component={() => (
        <AppLayout>
          <Dashboard />
        </AppLayout>
      )} />
      
      {/* Clients */}
      <ProtectedRoute path="/clients" component={() => (
        <AppLayout>
          <ClientsPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/clients/new" component={() => (
        <AppLayout>
          <ClientFormPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/clients/:id" component={() => (
        <AppLayout>
          <ClientFormPage />
        </AppLayout>
      )} />
      
      {/* Inventory - Products */}
      <ProtectedRoute path="/inventory/products" component={() => (
        <AppLayout>
          <ProductsPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/inventory/products/new" component={() => (
        <AppLayout>
          <ProductFormPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/inventory/products/:id" component={() => (
        <AppLayout>
          <ProductFormPage />
        </AppLayout>
      )} />
      
      {/* Inventory - Warehouses */}
      <ProtectedRoute path="/inventory/warehouses" component={() => (
        <AppLayout>
          <WarehousesPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/inventory/warehouses/new" component={() => (
        <AppLayout>
          <WarehouseFormPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/inventory/warehouses/:id" component={() => (
        <AppLayout>
          <WarehouseFormPage />
        </AppLayout>
      )} />
      
      {/* Sales */}
      <ProtectedRoute path="/sales/invoices" component={() => (
        <AppLayout>
          <SalesInvoicesPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/sales/invoices/new" component={() => (
        <AppLayout>
          <SalesInvoiceFormPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/sales/invoices/:id" component={() => (
        <AppLayout>
          <SalesInvoiceFormPage />
        </AppLayout>
      )} />
      
      {/* Purchases */}
      <ProtectedRoute path="/purchases/invoices" component={() => (
        <AppLayout>
          <PurchasesInvoicesPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/purchases/invoices/new" component={() => (
        <AppLayout>
          <PurchasesInvoiceFormPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/purchases/invoices/:id" component={() => (
        <AppLayout>
          <PurchasesInvoiceFormPage />
        </AppLayout>
      )} />
      
      {/* Treasury */}
      <ProtectedRoute path="/treasury/transactions" component={() => (
        <AppLayout>
          <TransactionsPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/treasury/transactions/new" component={() => (
        <AppLayout>
          <TransactionFormPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/treasury/transactions/:id" component={() => (
        <AppLayout>
          <TransactionFormPage />
        </AppLayout>
      )} />
      
      {/* Reports */}
      <ProtectedRoute path="/reports/sales" component={() => (
        <AppLayout>
          <SalesReportPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/reports/purchases" component={() => (
        <AppLayout>
          <PurchasesReportPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/reports/inventory" component={() => (
        <AppLayout>
          <InventoryReportPage />
        </AppLayout>
      )} />
      <ProtectedRoute path="/reports/clients" component={() => (
        <AppLayout>
          <ClientsReportPage />
        </AppLayout>
      )} />
      
      {/* Settings */}
      <ProtectedRoute path="/settings" component={() => (
        <AppLayout>
          <SettingsPage />
        </AppLayout>
      )} />
      
      {/* This catch-all route should be last */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <Router />
          <Toaster />
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
