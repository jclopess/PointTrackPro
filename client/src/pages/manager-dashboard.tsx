import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, LogOut, FileText, TriangleAlert, CheckCircle, XCircle, Eye, Edit, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmployeeTable } from "@/components/employee-table";
import { ReportModal } from "@/components/report-modal";
import { useState } from "react";
import { Link } from "wouter";

export default function ManagerDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const today = new Date().toISOString().split('T')[0];

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/manager/employees"],
  });

  const { data: todayRecords = [] } = useQuery({
    queryKey: ["/api/manager/time-records", today],
  });

  const { data: pendingJustifications = [] } = useQuery({
    queryKey: ["/api/manager/justifications/pending"],
  });

  const approveJustificationMutation = useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      apiRequest("POST", `/api/manager/justifications/${id}/approve`, { approved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/justifications"] });
      toast({
        title: "Justificativa processada",
        description: "A justificativa foi processada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStats = () => {
    const totalEmployees = employees.length;
    const presentToday = todayRecords.filter((record: any) => record.entry1).length;
    const pendingJustificationsCount = pendingJustifications.length;
    
    // Calculate overtime hours for current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const overtimeHours = 0; // This would be calculated from hour bank data

    return {
      totalEmployees,
      presentToday,
      pendingJustifications: pendingJustificationsCount,
      overtimeHours: `${overtimeHours}h`,
    };
  };

  const stats = getStats();

  const filteredEmployees = employees.filter((employee: any) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    
    const todayRecord = todayRecords.find((record: any) => record.userId === employee.id);
    const isPresent = todayRecord?.entry1;
    
    if (statusFilter === "present") return matchesSearch && isPresent;
    if (statusFilter === "absent") return matchesSearch && !isPresent;
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex-shrink-0">
                <Clock className="text-primary text-2xl" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Painel do Gestor</h1>
                <p className="text-sm text-gray-500">Gerenciamento de Equipe</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm text-gray-600">{user?.name}</span>
                <Badge>Gestor</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Manager Dashboard Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Painel do Gestor</h2>
                  <p className="text-gray-600">Gerencie registros e relatórios da equipe</p>
                </div>
                <div className="mt-4 lg:mt-0 flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowReportModal(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="text-primary text-2xl" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Funcionários</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalEmployees}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="text-green-600 text-2xl" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Presenças Hoje</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.presentToday}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TriangleAlert className="text-orange-600 text-2xl" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Justificativas Pendentes</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.pendingJustifications}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="text-gray-600 text-2xl" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Horas Extras Mês</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.overtimeHours}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee Records Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Registros dos Funcionários</CardTitle>
                <div className="mt-3 sm:mt-0 sm:ml-4">
                  <div className="flex space-x-3">
                    <Input
                      placeholder="Buscar funcionário..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-auto"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="present">Presente</SelectItem>
                        <SelectItem value="absent">Ausente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EmployeeTable 
                employees={filteredEmployees} 
                timeRecords={todayRecords}
              />
            </CardContent>
          </Card>

          {/* Pending Justifications */}
          {pendingJustifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Justificativas Pendentes de Aprovação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingJustifications.map((justification: any) => (
                    <div key={justification.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{justification.user.name}</h4>
                            <span className="text-sm text-gray-500">
                              {new Date(justification.date).toLocaleDateString('pt-BR')}
                            </span>
                            <Badge variant="secondary">Pendente</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{justification.reason}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Tipo: {justification.type} • Enviado em {new Date(justification.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => approveJustificationMutation.mutate({ 
                              id: justification.id, 
                              approved: true 
                            })}
                            disabled={approveJustificationMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => approveJustificationMutation.mutate({ 
                              id: justification.id, 
                              approved: false 
                            })}
                            disabled={approveJustificationMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        employees={employees}
      />
    </div>
  );
}
