import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  requireManager = false,
  requireAdmin = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  requireManager?: boolean;
  requireAdmin?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
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

  // Check role-based access
  if (requireAdmin && user.role !== "admin") {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Acesso negado</h2>
            <p className="text-gray-600 mt-2">Você não tem permissão para acessar esta área.</p>
          </div>
        </div>
      </Route>
    );
  }

  if (requireManager && !["manager", "admin"].includes(user.role)) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Acesso negado</h2>
            <p className="text-gray-600 mt-2">Você não tem permissão para acessar esta área.</p>
          </div>
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