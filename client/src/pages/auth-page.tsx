import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Clock, CheckCircle, Users, BarChart3 } from "lucide-react";
import { Redirect } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [resetForm, setResetForm] = useState({ cpf: "" });
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const passwordResetMutation = useMutation({
    mutationFn: (cpf: string) => apiRequest("POST", "/api/password-reset", { cpf }),
    onSuccess: () => {
      toast({ 
        title: "Solicitação enviada", 
        description: "O gestor foi notificado sobre sua solicitação de reset de senha." 
      });
      setShowPasswordReset(false);
      setResetForm({ cpf: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    passwordResetMutation.mutate(resetForm.cpf);
  };

  // Redirect if already logged in - after all hooks
  if (user) {
    if (user.role === "admin") {
      return <Redirect to="/admin" />;
    } else if (user.role === "manager") {
      return <Redirect to="/manager" />;
    } else {
      return <Redirect to="/" />;
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Ponto</h1>
            <p className="mt-2 text-gray-600">Acesse sua conta para continuar</p>
          </div>

          {!showPasswordReset ? (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Usuário/CPF</Label>
                      <Input
                        id="username"
                        type="text"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                  
                  <div className="mt-6 text-center">
                    <Button
                      variant="link"
                      onClick={() => setShowPasswordReset(true)}
                      className="text-sm"
                    >
                      Esqueceu sua senha?
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Recuperar Senha</h3>
                    <p className="text-sm text-gray-600">
                      Digite seu CPF para solicitar a recuperação da senha
                    </p>
                  </div>
                  
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-cpf">CPF</Label>
                      <Input
                        id="reset-cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={resetForm.cpf}
                        onChange={(e) => setResetForm({ ...resetForm, cpf: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={passwordResetMutation.isPending}
                    >
                      {passwordResetMutation.isPending ? "Enviando..." : "Solicitar Reset de Senha"}
                    </Button>
                    <p className="text-sm text-gray-600 text-center">
                      Sua solicitação será enviada para o gestor, que entrará em contato para regularizar seu acesso.
                    </p>
                  </form>
                  
                  <div className="mt-6 text-center">
                    <Button
                      variant="link"
                      onClick={() => setShowPasswordReset(false)}
                      className="text-sm"
                    >
                      Voltar ao Login
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-white flex items-center justify-center">
        <div className="text-center max-w-lg">
          <div className="mb-8">
            <Clock className="h-16 w-16 mx-auto mb-4 text-white" />
            <h2 className="text-3xl font-bold mb-4">Controle de Ponto Digital</h2>
            <p className="text-lg text-blue-100 mb-8">
              Sistema completo para gestão de horários e acompanhamento de equipes
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-300" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Registro Sequencial</h3>
                <p className="text-sm text-blue-100">
                  Sistema de 4 marcações diárias com validação automática
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-300" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Gestão de Equipes</h3>
                <p className="text-sm text-blue-100">
                  Painel completo para supervisão e aprovação de justificativas
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-green-300" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Relatórios Detalhados</h3>
                <p className="text-sm text-blue-100">
                  Banco de horas e análises de produtividade
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}