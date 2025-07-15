import { Card, CardContent } from "@/components/ui/card";

interface TimeRegistrationGridProps {
  timeRecord?: {
    entry1?: string;
    exit1?: string;
    entry2?: string;
    exit2?: string;
  };
}

export function TimeRegistrationGrid({ timeRecord }: TimeRegistrationGridProps) {
  const timeSlots = [
    { label: "Entrada 1", value: timeRecord?.entry1, type: "entry" },
    { label: "Saída 1", value: timeRecord?.exit1, type: "exit" },
    { label: "Entrada 2", value: timeRecord?.entry2, type: "entry" },
    { label: "Saída 2", value: timeRecord?.exit2, type: "exit" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {timeSlots.map((slot, index) => (
        <Card key={index} className="bg-gray-50">
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-gray-600 mb-2">{slot.label}</div>
            <div className={`text-2xl font-bold mb-1 ${slot.value ? 'text-gray-900' : 'text-gray-400'}`}>
              {slot.value || '--:--'}
            </div>
            <div className={`text-xs ${slot.value ? 'text-gray-500' : 'text-gray-400'}`}>
              {slot.value ? 'Registrado' : 'Pendente'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
