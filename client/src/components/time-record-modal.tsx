import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type TimeRecord } from "@shared/schema";

interface TimeRecordModalProps {
  record: TimeRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; // Callback para recarregar os dados na página principal
}

export function TimeRecordModal({ record, open, onOpenChange, onSuccess }: TimeRecordModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    entry1: "",
    exit1: "",
    entry2: "",
    exit2: "",
  });

  useEffect(() => {
    if (record) {
      setFormData({
        entry1: record.entry1 || "",
        exit1: record.exit1 || "",
        entry2: record.entry2 || "",
        exit2: record.exit2 || "",
      });
    }
  }, [record]);

  const updateRecordMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("PUT", `/api/manager/time-records/${record?.id}`, data),
    onSuccess: () => {
      toast({ title: "Registro atualizado com sucesso!" });
      onSuccess(); // Chama o refetch na página do gestor
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRecordMutation.mutate(formData);
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Ponto</DialogTitle>
          <DialogDescription>
            Ajuste os horários do dia {new Date(`${record.date}T12:00:00Z`).toLocaleDateString('pt-BR')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entry1">Entrada 1</Label>
              <Input id="entry1" type="time" value={formData.entry1} onChange={(e) => setFormData({ ...formData, entry1: e.target.value })} />
            </div>
             <div>
              <Label htmlFor="exit1">Saída 1</Label>
              <Input id="exit1" type="time" value={formData.exit1} onChange={(e) => setFormData({ ...formData, exit1: e.target.value })} />
            </div>
             <div>
              <Label htmlFor="entry2">Entrada 2</Label>
              <Input id="entry2" type="time" value={formData.entry2} onChange={(e) => setFormData({ ...formData, entry2: e.target.value })} />
            </div>
             <div>
              <Label htmlFor="exit2">Saída 2</Label>
              <Input id="exit2" type="time" value={formData.exit2} onChange={(e) => setFormData({ ...formData, exit2: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={updateRecordMutation.isPending}>
              {updateRecordMutation.isPending ? "Salvando..." : "Salvar Ajustes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}