import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, LogOut, FileText, TriangleAlert, CheckCircle, XCircle, ArrowLeft, PlusCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmployeeTable } from "@/components/employee-table";
import { ReportModal } from "@/components/report-modal";
import { TimeRecordModal } from "@/components/time-record-modal";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { ManagerJustificationModal } from "@/components/manager-justification-modal";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { type TimeRecord } from "@shared/schema";

const justificationTypeLabels: { [key: string]: string } = {
  absence: "Falta",
  late: "Atraso",
  "early-leave": "Saída antecipada",
  error: "Erro no registro",
  vacation: "Férias",
  holiday: "Feriado",
  training: "Treinamento",
  "work-from-home": "Trabalho remoto",
  "health-problems": "Problemas de saúde",
  "family-issue": "Questões familiares",
  "external-meetings": "Reuniões externas",
  other: "Outros motivos",
};

export default function ManagerDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  // Estados para o modal de registro de ponto
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null);
  const [showTimeRecordModal, setShowTimeRecordModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showManagerJustificationModal, setShowManagerJustificationModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  // Verifica se o usuário precisa mudar a senha
  useEffect(() => {
    if (user?.mustChangePassword) {
      setShowChangePasswordModal(true);
    } else {
      setShowChangePasswordModal(false);
    }
  }, [user]);

  // A query de registros agora é dinâmica com base na data selecionada
  const { data: recordsByDate = [], refetch: refetchRecordsByDate } = useQuery({
    queryKey: ["/api/manager/time-records", selectedDate, user?.id],
    queryFn: ({ queryKey }) => apiRequest("GET", `${queryKey[0]}/${queryKey[1]}`).then(res => res.json()),
    enabled: !!user,
  });

  const { data: employees = [], refetch: refetchEmployees } = useQuery({
    queryKey: ["/api/manager/employees", user?.id],
    queryFn: ({ queryKey }) => apiRequest("GET", queryKey[0] as string).then(res => res.json()),
    enabled: !!user && !user?.mustChangePassword,
  });

  //Talvez seja necessário comentar para evitar conflitos com o novo endpoint
  const { data: todayRecords = [] } = useQuery({
    queryKey: ["/api/manager/time-records", today, user?.id],
    queryFn: ({ queryKey }) => apiRequest("GET", `${queryKey[0]}/${queryKey[1]}`).then(res => res.json()),
    enabled: !!user && !user?.mustChangePassword,
  });

  const { data: pendingJustifications = [], refetch: refetchJustifications } = useQuery({
    queryKey: ["/api/manager/justifications/pending", user?.id],
    queryFn: ({ queryKey }) => apiRequest("GET", queryKey[0] as string).then(res => res.json()),
    enabled: !!user && !user?.mustChangePassword,
  });

  const approveJustificationMutation = useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      apiRequest("POST", `/api/manager/justifications/${id}/approve`, { approved }),
    onSuccess: () => {
      refetchJustifications();
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

    return {
      totalEmployees,
      presentToday,
      pendingJustifications: pendingJustificationsCount,
    };
  };

  const stats = getStats();

  const handleEditRecord = (record: TimeRecord) => {
    setEditingRecord(record);
    setShowTimeRecordModal(true);
  };

  const filteredEmployees = employees.filter((employee: any) => {
    if (selectedEmployee === "all") return true;
    return employee.id === parseInt(selectedEmployee);
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
                  <Button onClick={() => setShowManagerJustificationModal(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />Lançar Afastamento</Button>
                  <Button variant="outline"onClick={() =>setShowReportModal(true)}>
                    <FileText className="h-4 w-4 mr-2" />Gerar Relatório</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>

          {/* Employee Records Table */}
 <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Registros dos Funcionários</CardTitle>
                <div className="mt-3 sm:mt-0 sm:ml-4">
                  <div className="flex space-x-3">
                    {/* FILTRO DE DATA */}
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full sm:w-auto"
                    />
                    {/* FILTRO DE FUNCIONÁRIO (SELECT) */}
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os funcionários</SelectItem>
                        {employees.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EmployeeTable 
                employees={filteredEmployees} 
                timeRecords={recordsByDate}
                onEditRecord={handleEditRecord} // Passa a função para a tabela
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
                            <h4 className="text-sm font-medium text-black-900">{justification.user.name}</h4>
                            <span className="text-sm text-gray-500">
                              {new Date(justification.date).toLocaleDateString('pt-BR')}
                            </span>
                            <Badge variant={justification.status === 'pending' ? 'secondary' : 'default'}>
                              {justification.status === 'pending' ? 'Pendente' : justification.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">Tipo: {justificationTypeLabels[justification.type] || justification.type}</p>
                          <p className="text-sm text-gray-600 mb-1">Motivo: {justification.reason} • Enviado em {new Date(justification.createdAt).toLocaleDateString('pt-BR')}</p>
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

      <ReportModal // Modal for generating reports
        open={showReportModal}
        onOpenChange={setShowReportModal}
        employees={employees}
      />
      <ManagerJustificationModal
        open={showManagerJustificationModal}
        onOpenChange={setShowManagerJustificationModal}
        employees={employees}
        onSuccess={() => {
          // Adicione aqui os refetches necessários se precisar atualizar outras listas
          refetchJustifications();
        }}
      />
      <TimeRecordModal // Modal for creating or editing time records
        record={editingRecord}
        open={showTimeRecordModal}
        onOpenChange={setShowTimeRecordModal}
        onSuccess={refetchRecordsByDate}
      />
      <ChangePasswordModal //Modal for changing password
        open={showChangePasswordModal}
        onSuccess={() => {
        }}
      />
    </div>
  );
}
