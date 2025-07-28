import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

// A prop `children` nos permite "envolver" outros componentes
export function ProtectedRoute({
  children,
  requireManager = false,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireManager?: boolean;
  requireAdmin?: boolean;
}) {
  const { user, isLoading } = useAuth();

  // 1. Enquanto a autenticação está sendo verificada, mostramos um loader.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // 2. Se, após a verificação, não houver usuário, redirecionamos para o login.
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // 3. Verificamos as permissões (roles).
  if (requireAdmin && user.role !== "admin") {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold text-center text-red-600">Acesso Negado</h2>
              <p className="text-gray-600 mt-2">Você não tem permissão para acessar esta área.</p>
            </CardContent>
          </Card>
        </div>
    );
  }

  if (requireManager && !["manager", "admin"].includes(user.role)) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold text-center text-red-600">Acesso Negado</h2>
              <p className="text-gray-600 mt-2">Você não tem permissão para acessar esta área.</p>
            </CardContent>
          </Card>
        </div>
    );
  }

  // 4. Se tudo estiver certo, renderizamos o componente filho (a página).
  return <>{children}</>;
}