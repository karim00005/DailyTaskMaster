import { useAuth } from "@/context/AuthContext";
import { Route, Redirect } from "wouter";
import { Loader2 } from "lucide-react";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
  requiredRole?: string;
};

export function ProtectedRoute({ 
  path, 
  component: Component, 
  requiredRole 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check for role requirements
  if (requiredRole && user.role !== requiredRole) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold mb-4">غير مصرح</h1>
          <p className="text-muted-foreground">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}