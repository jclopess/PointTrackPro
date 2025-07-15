import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, LogOut, Plus, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TimeRegistrationGrid } from "@/components/time-registration-grid";
import { JustificationModal } from "@/components/justification-modal";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: todayRecord, refetch: refetchToday } = useQuery({
    queryKey: ["/api/time-records/today"],
    enabled: user?.role === "employee", // Only fetch for employees
  });

  const { data: timeRecords = [] } = useQuery({
    queryKey: ["/api/time-records", selectedMonth],
    queryFn: () => 
      fetch(`/api/time-records?month=${selectedMonth}`, { credentials: "include" })
        .then(res => res.json()),
    enabled: user?.role === "employee", // Only fetch for employees
  });

  const { data: justifications = [] } = useQuery({
    queryKey: ["/api/justifications"],
    enabled: user?.role === "employee", // Only fetch for employees
  });

  const timeRegistrationMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/time-records"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-records"] });
      refetchToday();
      toast({
        title: "Registro realizado",
        description: "Horário registrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getNextRegistrationType = () => {
    if (!todayRecord) return "Entrada 1";
    if (!todayRecord.exit1) return "Saída 1";
    if (!todayRecord.entry2) return "Entrada 2";
    if (!todayRecord.exit2) return "Saída 2";
    return "Completo";
  };

  const canRegister = () => {
    return getNextRegistrationType() !== "Completo";
  };

  const getNextAvailableTime = () => {
    if (!todayRecord) return "Agora";
    
    const lastTime = todayRecord.exit2 || todayRecord.entry2 || todayRecord.exit1 || todayRecord.entry1;
    if (!lastTime) return "Agora";
    
    const [hours, minutes] = lastTime.split(':').map(Number);
    const nextHour = hours + 1;
    return `${String(nextHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Clock className="text-primary text-2xl" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Sistema de Ponto</h1>
                <p className="text-sm text-gray-500">Registro de Funcionários</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm text-gray-600">{user?.name}</span>
                <Badge variant={user?.role === "manager" ? "default" : "secondary"}>
                  {user?.role === "manager" ? "Gestor" : "Funcionário"}
                </Badge>
              </div>
              {user?.role === "manager" && (
                <Link href="/manager">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Painel Gestor
                  </Button>
                </Link>
              )}
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
          {/* Current Date and Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Registro de Hoje</h2>
                  <p className="text-sm text-gray-600">{getCurrentDate()}</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <Clock className="h-3 w-3 mr-1" />
                    Dentro do horário
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Registration - Only for employees */}
          {user?.role === "employee" && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Registros do Dia</h3>
                
                <TimeRegistrationGrid timeRecord={todayRecord} />

                <div className="text-center mt-8">
                  <Button
                    size="lg"
                    onClick={() => timeRegistrationMutation.mutate()}
                    disabled={!canRegister() || timeRegistrationMutation.isPending}
                    className="px-8 py-4 text-lg"
                  >
                    <Clock className="mr-3 h-5 w-5" />
                    {canRegister() ? `Registrar ${getNextRegistrationType()}` : "Registros Completos"}
                  </Button>
                  {canRegister() && (
                    <p className="text-sm text-gray-500 mt-2">
                      Próximo registro disponível em: <span className="font-medium">{getNextAvailableTime()}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions - Only for employees */}
          {user?.role === "employee" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Historical Records */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Histórico de Registros</h3>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    {timeRecords.slice(0, 5).map((record: any) => (
                      <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {record.totalHours ? `${record.totalHours}h trabalhadas` : "Registro incompleto"}
                          </div>
                        </div>
                        <Badge variant={record.totalHours ? "default" : "secondary"}>
                          {record.totalHours ? "Completo" : "Pendente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-2">
                      Filtrar por mês:
                    </label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getMonthOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Justifications */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Justificativas</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowJustificationModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nova
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {justifications.slice(0, 3).map((justification: any) => (
                      <div key={justification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <Badge variant={justification.status === "pending" ? "secondary" : 
                                        justification.status === "approved" ? "default" : "destructive"}>
                            {justification.status === "pending" ? "Pendente" :
                             justification.status === "approved" ? "Aprovado" : "Rejeitado"}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(justification.date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-600">{justification.reason}</p>
                        </div>
                      </div>
                    ))}
                    {justifications.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhuma justificativa enviada
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Manager Info */}
          {user?.role === "manager" && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Bem-vindo, Gestor!</h3>
                  <p className="text-gray-600 mb-4">
                    Como gestor, você tem acesso ao painel de gerenciamento da equipe.
                  </p>
                  <Link href="/manager">
                    <Button className="px-6 py-3">
                      <Users className="h-4 w-4 mr-2" />
                      Acessar Painel de Gestão
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <JustificationModal
        open={showJustificationModal}
        onOpenChange={setShowJustificationModal}
      />
    </div>
  );
}
