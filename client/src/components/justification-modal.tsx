import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JustificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JustificationModal({ open, onOpenChange }: JustificationModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: "",
    type: "",
    reason: "",
  });

  const submitJustificationMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/justifications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/justifications"] });
      toast({
        title: "Justificativa enviada",
        description: "Sua justificativa foi enviada para aprovação.",
      });
      setFormData({ date: "", type: "", reason: "" });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.type || !formData.reason) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    submitJustificationMutation.mutate(formData);
  };

  const typeOptions = [
    { value: "absence", label: "Falta" },
    { value: "late", label: "Atraso" },
    { value: "early-leave", label: "Saída antecipada" },
    { value: "error", label: "Erro no registro" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Justificativa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="justification-date">Data</Label>
            <Input
              id="justification-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="justification-type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
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
            <Label htmlFor="justification-reason">Motivo</Label>
            <Textarea
              id="justification-reason"
              rows={3}
              placeholder="Descreva o motivo da justificativa..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitJustificationMutation.isPending}
            >
              {submitJustificationMutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
