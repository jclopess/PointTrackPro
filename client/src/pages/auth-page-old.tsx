import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle, Users, BarChart3 } from "lucide-react";
import { Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [resetForm, setResetForm] = useState({ cpf: "" });
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const passwordResetMutation = useMutation({
    mutationFn: (cpf: string) => apiRequest("POST", "/api/password-reset", { cpf }),
    onSuccess: () => {
      toast({ title: "Solicitação enviada", description: "O gestor foi notificado sobre sua solicitação de reset de senha." });
      setShowPasswordReset(false);
      setResetForm({ cpf: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    passwordResetMutation.mutate(resetForm.cpf);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <Clock className="h-12 w-12 text-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Sistema de Ponto</h2>
            <p className="mt-2 text-sm text-gray-600">
              Gerencie registros de ponto de forma eficiente
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Fazer Login</CardTitle>
                  <CardDescription>
                    Entre com suas credenciais para acessar o sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Usuário</Label>
                      <Input
                        id="login-username"
                        type="text"
                        placeholder="Digite seu usuário"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Digite sua senha"
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Conta</CardTitle>
                  <CardDescription>
                    Cadastre-se para começar a usar o sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nome Completo</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Digite seu nome completo"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Usuário</Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="Escolha um nome de usuário"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Digite uma senha"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-role">Função</Label>
                      <Select
                        value={registerForm.role}
                        onValueChange={(value) => setRegisterForm({ ...registerForm, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Funcionário</SelectItem>
                          <SelectItem value="manager">Gestor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {registerForm.role === "employee" && (
                      <div className="space-y-2">
                        <Label htmlFor="register-department">Departamento</Label>
                        <Select
                          value={registerForm.departmentId}
                          onValueChange={(value) => setRegisterForm({ ...registerForm, departmentId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept: any) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="register-hours">Carga Horária Diária</Label>
                      <Select
                        value={registerForm.dailyWorkHours}
                        onValueChange={(value) => setRegisterForm({ ...registerForm, dailyWorkHours: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4.00">4 horas (Meio período)</SelectItem>
                          <SelectItem value="6.00">6 horas (Estagiário)</SelectItem>
                          <SelectItem value="8.00">8 horas (Integral)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex lg:flex-1 bg-primary text-white">
        <div className="flex flex-col justify-center p-12 space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">
              Controle de Ponto Inteligente
            </h1>
            <p className="text-xl text-blue-100">
              Simplifique o gerenciamento de horários para funcionários terceirizados e estagiários
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <CheckCircle className="h-8 w-8 text-green-300" />
              <div>
                <h3 className="font-semibold">Registro Sequencial</h3>
                <p className="text-blue-100">4 marcações diárias com validação de intervalos</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-green-300" />
              <div>
                <h3 className="font-semibold">Gestão de Equipes</h3>
                <p className="text-blue-100">Supervisão e aprovação de justificativas</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <BarChart3 className="h-8 w-8 text-green-300" />
              <div>
                <h3 className="font-semibold">Relatórios Completos</h3>
                <p className="text-blue-100">Banco de horas e relatórios de fechamento</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-6">
            <h4 className="font-semibold mb-2">Recursos Principais:</h4>
            <ul className="space-y-1 text-sm text-blue-100">
              <li>• Intervalo mínimo de 1h entre registros</li>
              <li>• Histórico mensal de registros</li>
              <li>• Sistema de justificativas</li>
              <li>• Calculadora de banco de horas</li>
              <li>• Relatórios em PDF para assinatura</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
