import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { User, TimeRecord, HourBank } from '@shared/schema';

// Tipos de dados esperados pelo gerador
interface ReportData {
  user: User;
  timeRecords: TimeRecord[];
  month: string; // Formato YYYY-MM
}

// Função auxiliar para calcular horas diárias
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
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });

    // --- Conteúdo do PDF ---

    // Cabeçalho com Logotipo
    const logoPath = path.resolve(process.cwd(), 'attached_assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 450, 20, { width: 100 });
    }
    doc.fontSize(18).text('Relatório Mensal', { align: 'center' });
    doc.moveDown();

    // Informações do Funcionário
    const reportMonth = new Date(`${data.month}-02`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    doc.fontSize(12).text(`Funcionário: ${data.user.name}`);
    doc.text(`CPF: ${data.user.cpf}`);
    doc.text(`Período: ${reportMonth.charAt(0).toUpperCase() + reportMonth.slice(1)}`);
    doc.moveDown();

    // Tabela de Registros
    doc.fontSize(14).text('Registros Diários', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemWidth = 80;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Data', 50, tableTop);
    doc.text('Entrada 1', 50 + itemWidth, tableTop);
    doc.text('Saída 1', 50 + itemWidth * 2, tableTop);
    doc.text('Entrada 2', 50 + itemWidth * 3, tableTop);
    doc.text('Saída 2', 50 + itemWidth * 4, tableTop);
    doc.text('Total Horas', 50 + itemWidth * 5, tableTop, { width: itemWidth, align: 'center' });
    doc.moveDown();

    doc.font('Helvetica');
    let totalMonthHours = 0;
    data.timeRecords.forEach(record => {
      const rowY = doc.y;
      const formattedDate = new Date(`${record.date}T12:00:00Z`).toLocaleDateString('pt-BR');
      
      const dailyHours = calculateDailyHours(record);
      totalMonthHours += dailyHours;
      const dailyHoursString = dailyHours > 0 ? dailyHours.toFixed(2) : '00.00';

      doc.text(formattedDate, 50, rowY);
      doc.text(record.entry1 || '--:--', 50 + itemWidth, rowY);
      doc.text(record.exit1 || '--:--', 50 + itemWidth * 2, rowY);
      doc.text(record.entry2 || '--:--', 50 + itemWidth * 3, rowY);
      doc.text(record.exit2 || '--:--', 50 + itemWidth * 4, rowY);
      doc.text(dailyHoursString, 50 + itemWidth * 5, rowY, { width: itemWidth, align: 'center' });
      doc.moveDown();
    });

    // Resumo do Total de Horas Trabalhadas
    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').text('Resumo Mensal', 50);
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold')
      .text(`Total de horas trabalhadas no mês: ${totalMonthHours.toFixed(2)}h`, 50);

    // Rodapé para Assinaturas
    const signatureY = doc.page.height - 100;
    doc.fontSize(12).font('Helvetica')
      .text('____________________________', 50, signatureY)
      .text(data.user.name, 50, signatureY + 15);
      
    doc.text('____________________________', 350, signatureY, { align: 'right' })
      .text('Assinatura do Gestor', 350, signatureY + 15, { align: 'right' });


    // Finaliza o documento
    doc.end();
  });
}