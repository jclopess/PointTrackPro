import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users, Building, Briefcase, FileText, RotateCcw } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showFunctionModal, setShowFunctionModal] = useState(false);
  const [showEmploymentTypeModal, setShowEmploymentTypeModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Queries
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: functions = [] } = useQuery({
    queryKey: ["/api/admin/functions"],
  });

  const { data: employmentTypes = [] } = useQuery({
    queryKey: ["/api/admin/employment-types"],
  });

  const { data: passwordResetRequests = [] } = useQuery({
    queryKey: ["/api/admin/password-reset-requests"],
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => apiRequest("POST", "/api/admin/users", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowUserModal(false);
      setEditingItem(null);
      toast({ title: "Usuário criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...userData }: any) => apiRequest("PUT", `/api/admin/users/${id}`, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowUserModal(false);
      setEditingItem(null);
      toast({ title: "Usuário atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => 
      apiRequest("POST", `/api/admin/users/${id}/reset-password`, { password }),
    onSuccess: () => {
      toast({ title: "Senha redefinida com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-center text-red-600">
              Acesso negado. Apenas administradores podem acessar esta área.
            </h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600">Gerenciamento completo do sistema</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="departments">Departamentos</TabsTrigger>
            <TabsTrigger value="functions">Funções</TabsTrigger>
            <TabsTrigger value="employment-types">Vínculos</TabsTrigger>
            <TabsTrigger value="password-resets">Reset de Senhas</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gerenciamento de Usuários
                  </CardTitle>
                  <Button onClick={() => setShowUserModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-medium">{user.name}</h3>
                            <p className="text-sm text-gray-500">CPF: {user.cpf}</p>
                            <p className="text-sm text-gray-500">
                              {user.department?.name || "Sem departamento"} - {user.function?.name || "Sem função"}
                            </p>
                          </div>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status === "active" ? "Ativo" : user.status === "blocked" ? "Bloqueado" : "Inativo"}
                          </Badge>
                          <Badge variant="outline">
                            {user.role === "admin" ? "Admin" : user.role === "manager" ? "Gestor" : "Funcionário"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem(user);
                            setShowUserModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPassword = prompt("Nova senha:");
                            if (newPassword) {
                              resetPasswordMutation.mutate({ id: user.id, password: newPassword });
                            }
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Reset Requests Tab */}
          <TabsContent value="password-resets">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Solicitações de Reset de Senha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {passwordResetRequests.filter((req: any) => req.status === "pending").map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">CPF: {request.cpf}</h3>
                        <p className="text-sm text-gray-500">
                          Solicitado em: {new Date(request.requestedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          const newPassword = prompt("Nova senha para o usuário:");
                          if (newPassword) {
                            // Implementation would require backend endpoint
                            toast({ title: "Funcionalidade em desenvolvimento" });
                          }
                        }}
                      >
                        Resolver
                      </Button>
                    </div>
                  ))}
                  {passwordResetRequests.filter((req: any) => req.status === "pending").length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Nenhuma solicitação pendente
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Modal - Would be implemented fully */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>CPF</Label>
              <Input placeholder="000.000.000-00" />
            </div>
            <div>
              <Label>Nome Completo</Label>
              <Input placeholder="Nome completo" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input placeholder="(00) 90000-0000" />
            </div>
            <div>
              <Label>Departamento</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
            <div>
              <Label>Função</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {functions.map((func: any) => (
                    <SelectItem key={func.id} value={func.id.toString()}>
                      {func.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Vínculo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Perfil</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Funcionário</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowUserModal(false)}>
              Cancelar
            </Button>
            <Button>
              {editingItem ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}