import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { User, TimeRecord, Justification, HourBank } from '../shared/schema';
import { getDaysInMonth, eachDayOfInterval, format, getDay } from 'date-fns';

interface ReportData {
  user: User;
  timeRecords: TimeRecord[];
  month: string;
  approvedJustifications: Justification[];
  startDate: string;
  endDate: string;
}

const justificationTypeLabels: { [key: string]: string } = {
  absence: "Falta",
  late: "Atraso",
  "early-leave": "Saída antecipada",
  error: "Erro no registro",
  vacation: "Férias",
  holiday: "Feriado",
  training: "Treinamento",
  "work-from-home": "Trabalho remoto",
  "health-problems": "Atestado Médico",
  "family-issue": "Licença Familiar",
  "external-meetings": "Reunião Externa",
  other: "Outros",
};

function calculateDailyHours(record: TimeRecord): number {
    let totalMinutes = 0;
    if (record.entry1 && record.exit1) {
        const entry1Minutes = parseInt(record.entry1.split(':')[0]) * 60 + parseInt(record.entry1.split(':')[1]);
        const exit1Minutes = parseInt(record.exit1.split(':')[0]) * 60 + parseInt(record.exit1.split(':')[1]);
        totalMinutes += (exit1Minutes - entry1Minutes);
    }
    if (record.entry2 && record.exit2) {
        const entry2Minutes = parseInt(record.entry2.split(':')[0]) * 60 + parseInt(record.entry2.split(':')[1]);
        const exit2Minutes = parseInt(record.exit2.split(':')[0]) * 60 + parseInt(record.exit2.split(':')[1]);
        totalMinutes += (exit2Minutes - entry2Minutes);
    }
    return totalMinutes / 60;
}

export function generateMonthlyReportPDF(data: ReportData): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // --- Conteúdo do PDF ---
    const logoPath = path.resolve(process.cwd(), 'attached_assets', 'logo.png');
    if (fs.existsSync(logoPath)) doc.image(logoPath, 450, 20, { width: 100 });
    doc.fontSize(16).text('Relatório de Ponto Mensal', { align: 'center' });
    doc.moveDown(0.5);

    const reportMonth = new Date(`${data.month}-02`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const formattedStartDate = new Date(`${data.startDate}T12:00:00Z`).toLocaleDateString('pt-BR');
    const formattedEndDate = new Date(`${data.endDate}T12:00:00Z`).toLocaleDateString('pt-BR');
    const dadosFuncionario = doc.page.margins.top + 40;
    doc.fontSize(12).text(`Funcionário: ${data.user.name}`, 50, dadosFuncionario);
    doc.text(`CPF: ${data.user.cpf}`, 50, dadosFuncionario + 15);
    doc.text(`Referência: ${reportMonth.charAt(0).toUpperCase() + reportMonth.slice(1)}`, 50, dadosFuncionario, { align: 'right' });
    doc.font('Helvetica-Bold').text(`Período: ${formattedStartDate} a ${formattedEndDate}`, 50, dadosFuncionario +15, { align: 'right' });
    doc.moveDown(0.5);

    doc.fontSize(12).text('Registros Diários', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemWidth = 80;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Data', 50, tableTop);
    doc.text('Entrada 1', 50 + itemWidth, tableTop);
    doc.text('Saída 1', 50 + itemWidth * 2, tableTop);
    doc.text('Entrada 2', 50 + itemWidth * 3, tableTop);
    doc.text('Saída 2', 50 + itemWidth * 4, tableTop);
    doc.text('Total Horas', 50 + itemWidth * 5, tableTop, { width: itemWidth, align: 'right' });
    doc.moveDown();

    let totalMonthHours = 0;
    const interval = {
      start: new Date(`${data.startDate}T12:00:00Z`),
      end: new Date(`${data.endDate}T12:00:00Z`)
    };
    const allDaysInPeriod = eachDayOfInterval(interval);

    allDaysInPeriod.forEach(day => {
      const dateString = format(day, 'yyyy-MM-dd');
      const dayOfWeek = getDay(day);
      
      const record = data.timeRecords.find(r => r.date === dateString);
      const justification = data.approvedJustifications.find(j => j.date === dateString)
      
      const rowY = doc.y;
      const formattedDate = format(day, 'dd/MM/yyyy');

      doc.font('Helvetica').fontSize(7);
      doc.text(formattedDate, 50, rowY);

        if (record) {
            const dailyHours = calculateDailyHours(record);
            totalMonthHours += dailyHours;
            const dailyHoursString = dailyHours > 0 ? dailyHours.toFixed(2) : '0.00';
            
            const textOptions = { underline: record.isAdjusted };
            doc.text(record.entry1 || '--:--', 50 + itemWidth, rowY, textOptions);
            doc.text(record.exit1 || '--:--', 50 + itemWidth * 2, rowY, textOptions);
            doc.text(record.entry2 || '--:--', 50 + itemWidth * 3, rowY, textOptions);
            doc.text(record.exit2 || '--:--', 50 + itemWidth * 4, rowY, textOptions);
            doc.text(dailyHoursString, 50 + itemWidth * 5, rowY, { ...textOptions, width: itemWidth, align: 'right' });
        } else if (justification) {
            const label = justificationTypeLabels[justification.type] || justification.type;
            
            // --- LÓGICA CORRIGIDA AQUI ---
            if (justification.type === 'holiday') {
                doc.fillColor('red').text(label, 50 + itemWidth, rowY, { width: itemWidth * 4, align: 'center' }).fillColor('black');
            } else {
                const textToDisplay = justification.abona_horas ? `${label} (Abonado)` : label;
                doc.fillColor('blue').text(textToDisplay, 50 + itemWidth, rowY, { width: itemWidth * 4, align: 'center' }).fillColor('black');
            }
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            doc.fillColor('red').text("Folga", 50 + itemWidth, rowY, { width: itemWidth * 4, align: 'center' }).fillColor('black');
        } else {
            doc.fillColor('gray').text("Sem registro", 50 + itemWidth, rowY, { width: itemWidth * 4, align: 'center' }).fillColor('black');
        }
        doc.moveDown();
    });

    const resumo = doc.page.height - 130;
    doc.fontSize(12).font('Helvetica-Bold').text('Resumo Mensal', 50, resumo);
    doc.fontSize(12).font('Helvetica-Bold').text(`Horas trabalhadas no mês: ${totalMonthHours.toFixed(2)}h`, 50, resumo + 15, { align: 'left' });
    doc.font('Helvetica-Bold').text(`Total de justificativas aprovadas: ${data.approvedJustifications.length}`, 50, resumo +15, { align: 'right' });

    //const signatureY = doc.y > 680 ? doc.addPage().y + 50 : doc.y + 70;
    const signatureY = doc.page.height - 80;
    doc.fontSize(12).font('Helvetica')
      .text('_________________________', 50, signatureY)
      .text(data.user.name, 50, signatureY + 15);
      
    doc.text('_________________________', 350, signatureY, { align: 'right' })
      .text('Assinatura do Gestor', 350, signatureY + 15, { align: 'right' });

    doc.end();
  });
}