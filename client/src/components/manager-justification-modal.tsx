import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ManagerJustificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: any[]; // Lista de funcionários para selecionar
  onSuccess: () => void; // Para recarregar dados
}

export function ManagerJustificationModal({ open, onOpenChange, employees, onSuccess }: ManagerJustificationModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    userId: "",
    date: "",
    type: "",
    reason: "",
  });

  // Limpa o formulário quando o modal é fechado
  useEffect(() => {
    if (!open) {
      setFormData({ userId: "", date: "", type: "", reason: "" });
    }
  }, [open]);

  const createJustificationMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/manager/justifications", data),
    onSuccess: () => {
      toast({ title: "Justificativa criada com sucesso!" });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar justificativa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.date || !formData.type || !formData.reason) {
      toast({ title: "Erro", description: "Todos os campos são obrigatórios.", variant: "destructive" });
      return;
    }
    createJustificationMutation.mutate(formData);
  };

  const typeOptions = [
    { value: "vacation", label: "Férias" },
    { value: "health-problems", label: "Atestado Médico / Problemas de saúde" },
    { value: "family-issue", label: "Licença (Luto, Maternidade, etc.)" },
    { value: "training", label: "Treinamento Externo" },
    { value: "holiday", label: "Feriado" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lançar Justificativa para Funcionário</DialogTitle>
          <DialogDescription>
            Use para registrar férias, licenças e outros afastamentos abonados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employee-select">Funcionário</Label>
            <Select
              value={formData.userId}
              onValueChange={(value) => setFormData({ ...formData, userId: value })}
            >
              <SelectTrigger id="employee-select">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="justification-date">Data do Afastamento</Label>
            <Input
              id="justification-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="justification-type">Tipo de Justificativa</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="justification-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="justification-reason">Motivo/Descrição</Label>
            <Textarea
              id="justification-reason"
              rows={3}
              placeholder="Ex: Atestado médico de 1 dia"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createJustificationMutation.isPending}>
              {createJustificationMutation.isPending ? "Salvando..." : "Salvar Justificativa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}