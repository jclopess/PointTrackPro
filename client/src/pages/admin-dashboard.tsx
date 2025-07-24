import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users, Building, Briefcase, FileText, RotateCcw, LogOut } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  // State for modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showFunctionModal, setShowFunctionModal] = useState(false);
  const [showEmploymentTypeModal, setShowEmploymentTypeModal] = useState(false);

  // State for editing and deleting
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<{type: string, data: any} | null>(null);


  // Queries
  const { data: users = [] } = useQuery({ queryKey: ["/api/admin/users"] });
  const { data: departments = [] } = useQuery({ queryKey: ["/api/departments"] });
  const { data: functions = [] } = useQuery({ queryKey: ["/api/admin/functions"] });
  const { data: employmentTypes = [] } = useQuery({ queryKey: ["/api/admin/employment-types"] });
  const { data: passwordResetRequests = [] } = useQuery({ queryKey: ["/api/admin/password-reset-requests"] });

  // Mutations for User
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => apiRequest("POST", "/api/admin/users", userData).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowUserModal(false);
      setEditingItem(null);
      toast({
        title: "Usuário criado com sucesso!",
        description: `A senha temporária é: ${data.tempPassword}`,
        duration: 10000,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
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

  const createDepartmentMutation = useMutation({
    mutationFn: (deptData: any) => apiRequest("POST", "/api/admin/departments", deptData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setShowDepartmentModal(false);
      setEditingItem(null);
      toast({ title: "Departamento criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
  
  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, ...deptData }: any) => apiRequest("PUT", `/api/admin/departments/${id}`, deptData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setShowDepartmentModal(false);
      setEditingItem(null);
      toast({ title: "Departamento atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setItemToDelete(null);
      toast({ title: "Departamento desativado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });


  const createFunctionMutation = useMutation({
    mutationFn: (funcData: any) => apiRequest("POST", "/api/admin/functions", funcData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/functions"] });
      setShowFunctionModal(false);
      setEditingItem(null);
      toast({ title: "Função criada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateFunctionMutation = useMutation({
    mutationFn: ({ id, ...funcData }: any) => apiRequest("PUT", `/api/admin/functions/${id}`, funcData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/functions"] });
      setShowFunctionModal(false);
      setEditingItem(null);
      toast({ title: "Função atualizada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteFunctionMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/functions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/functions"] });
      setItemToDelete(null);
      toast({ title: "Função desativada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });


  const createEmploymentTypeMutation = useMutation({
    mutationFn: (typeData: any) => apiRequest("POST", "/api/admin/employment-types", typeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employment-types"] });
      setShowEmploymentTypeModal(false);
      setEditingItem(null);
      toast({ title: "Vínculo criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateEmploymentTypeMutation = useMutation({
    mutationFn: ({ id, ...typeData }: any) => apiRequest("PUT", `/api/admin/employment-types/${id}`, typeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employment-types"] });
      setShowEmploymentTypeModal(false);
      setEditingItem(null);
      toast({ title: "Vínculo atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteEmploymentTypeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/employment-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employment-types"] });
      setItemToDelete(null);
      toast({ title: "Vínculo desativado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });


  // Handlers
  const handleUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
        cpf: formData.get('cpf'),
        name: formData.get('name'),
        username: formData.get('username'),
        phone: formData.get('phone'),
        departmentId: Number(formData.get('departmentId')),
        functionId: Number(formData.get('functionId')),
        employmentTypeId: Number(formData.get('employmentTypeId')),
        role: formData.get('role'),
        status: formData.get('status'),
    };
    
    if (editingItem) {
      // updateUserMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleOpenDepartmentModal = (dept: any | null = null) => {
    setEditingItem(dept);
    setShowDepartmentModal(true);
  };
  
  const handleDepartmentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
    };
    
    if (editingItem) {
      updateDepartmentMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createDepartmentMutation.mutate(data);
    }
  };

  const handleOpenFunctionModal = (func: any | null = null) => {
    setEditingItem(func);
    setShowFunctionModal(true);
  };

  const handleFunctionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
    };
    
    if (editingItem) {
      updateFunctionMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createFunctionMutation.mutate(data);
    }
  };
  
  const handleOpenEmploymentTypeModal = (type: any | null = null) => {
    setEditingItem(type);
    setShowEmploymentTypeModal(true);
  };

  const handleEmploymentTypeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      dailyWorkHours: formData.get('dailyWorkHours'),
    };
    
    if (editingItem) {
      updateEmploymentTypeMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createEmploymentTypeMutation.mutate(data);
    }
  };
  
  const handleDelete = () => {
    if (!itemToDelete) return;
    switch (itemToDelete.type) {
      case 'department':
        deleteDepartmentMutation.mutate(itemToDelete.data.id);
        break;
      case 'function':
        deleteFunctionMutation.mutate(itemToDelete.data.id);
        break;
      case 'employmentType':
        deleteEmploymentTypeMutation.mutate(itemToDelete.data.id);
        break;
      default:
        break;
    }
  };


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
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
            <p className="text-gray-600">Gerenciamento completo do sistema</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </header>

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

          {/* Departments Tab */}
          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Gerenciamento de Departamentos
                  </CardTitle>
                  <Button onClick={() => handleOpenDepartmentModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Departamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.map((dept: any) => (
                    <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{dept.name}</h3>
                        <p className="text-sm text-gray-500">{dept.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDepartmentModal(dept)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setItemToDelete({ type: 'department', data: dept })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Functions Tab */}
          <TabsContent value="functions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Gerenciamento de Funções
                  </CardTitle>
                  <Button onClick={() => handleOpenFunctionModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Função
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {functions.map((func: any) => (
                    <div key={func.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{func.name}</h3>
                        <p className="text-sm text-gray-500">{func.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenFunctionModal(func)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setItemToDelete({ type: 'function', data: func })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employment Types Tab */}
          <TabsContent value="employment-types">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Gerenciamento de Vínculos
                  </CardTitle>
                  <Button onClick={() => handleOpenEmploymentTypeModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Vínculo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employmentTypes.map((type: any) => (
                    <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{type.name}</h3>
                        <p className="text-sm text-gray-500">{type.description}</p>
                        <p className="text-sm text-blue-600">{type.dailyWorkHours}h por dia</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEmploymentTypeModal(type)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setItemToDelete({ type: 'employmentType', data: type })}>
                          <Trash2 className="h-4 w-4" />
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
      
      {/* Modals */}
      {/* User Modal - Create/Edit */}
      <Dialog open={showUserModal} onOpenChange={(isOpen) => { setShowUserModal(isOpen); if (!isOpen) setEditingItem(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUserSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CPF</Label>
                <Input name="cpf" placeholder="000.000.000-00" required defaultValue={editingItem?.cpf} />
              </div>
              <div>
                <Label>Nome Completo</Label>
                <Input name="name" placeholder="Nome completo" required defaultValue={editingItem?.name} />
              </div>
              <div>
                  <Label>Nome de Usuário</Label>
                  <Input name="username" placeholder="Ex: joao.silva" required defaultValue={editingItem?.username} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input name="phone" placeholder="(00) 90000-0000" defaultValue={editingItem?.phone} />
              </div>
              <div>
                <Label>Departamento</Label>
                <Select name="departmentId" required defaultValue={editingItem?.departmentId?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                <Select name="functionId" required defaultValue={editingItem?.functionId?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                <Select name="employmentTypeId" required defaultValue={editingItem?.employmentTypeId?.toString()}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                <Select name="role" required defaultValue={editingItem?.role || "employee"}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Funcionário</SelectItem>
                    <SelectItem value="manager">Gestor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" required defaultValue={editingItem?.status || "active"}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowUserModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {editingItem ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Department Modal (Create/Edit) */}
      <Dialog open={showDepartmentModal} onOpenChange={(isOpen) => { setShowDepartmentModal(isOpen); if (!isOpen) setEditingItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Departamento" : "Novo Departamento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDepartmentSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dept-name">Nome</Label>
                <Input id="dept-name" name="name" defaultValue={editingItem?.name} required />
              </div>
              <div>
                <Label htmlFor="dept-desc">Descrição</Label>
                <Input id="dept-desc" name="description" defaultValue={editingItem?.description} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowDepartmentModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}>
                {editingItem ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Function Modal (Create/Edit) */}
      <Dialog open={showFunctionModal} onOpenChange={(isOpen) => { setShowFunctionModal(isOpen); if (!isOpen) setEditingItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Função" : "Nova Função"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFunctionSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="func-name">Nome</Label>
                <Input id="func-name" name="name" defaultValue={editingItem?.name} required />
              </div>
              <div>
                <Label htmlFor="func-desc">Descrição</Label>
                <Input id="func-desc" name="description" defaultValue={editingItem?.description} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowFunctionModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createFunctionMutation.isPending || updateFunctionMutation.isPending}>
                {editingItem ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Employment Type Modal (Create/Edit) */}
      <Dialog open={showEmploymentTypeModal} onOpenChange={(isOpen) => { setShowEmploymentTypeModal(isOpen); if (!isOpen) setEditingItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Vínculo" : "Novo Vínculo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEmploymentTypeSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type-name">Nome</Label>
                <Input id="type-name" name="name" defaultValue={editingItem?.name} required />
              </div>
              <div>
                <Label htmlFor="type-desc">Descrição</Label>
                <Input id="type-desc" name="description" defaultValue={editingItem?.description} />
              </div>
              <div>
                <Label htmlFor="type-hours">Horas Diárias</Label>
                <Select name="dailyWorkHours" defaultValue={editingItem?.dailyWorkHours || "8.00"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4.00">4 horas</SelectItem>
                    <SelectItem value="6.00">6 horas</SelectItem>
                    <SelectItem value="8.00">8 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowEmploymentTypeModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createEmploymentTypeMutation.isPending || updateEmploymentTypeMutation.isPending}>
                {editingItem ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Desativação</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja desativar "{itemToDelete?.data.name}"? Esta ação pode ser revertida posteriormente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteDepartmentMutation.isPending || deleteFunctionMutation.isPending || deleteEmploymentTypeMutation.isPending}>
              Desativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}