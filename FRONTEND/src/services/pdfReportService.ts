import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportItem } from '../types';
import { generateReportHtml } from '../templates/reportTemplate';

/**
 * Service to convert the HTML report template into a high-resolution downloadable PDF dossier.
 */
export const PdfReportService = {
  /**
   * Generates and downloads an authentic, publication-quality PDF dossier for a given analysis report.
   */
  async downloadReportPdf(report: ReportItem): Promise<void> {
    const htmlString = generateReportHtml(report);

    // Create a temporary hidden offscreen container with exact fixed width for clean A4 rendering
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.backgroundColor = '#ffffff';
    container.style.zIndex = '-1000';
    container.innerHTML = htmlString;

    document.body.appendChild(container);

    try {
      // Find the inner report content
      const reportElement = container.querySelector('#satquery-report-dossier') as HTMLElement || container;

      // Render the styled HTML container to a high-DPI canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2, // 2x retina clarity for crisp text and graphics
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // Create A4 PDF in portrait mode
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Compute proportional height
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight) {
        // Fits on single page
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      } else {
        // Multi-page rendering
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      // Trigger direct PDF download
      const cleanId = report.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`SatQuery_Report_${cleanId}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF report from HTML template:', err);
      // Fallback: Trigger browser print-to-PDF if canvas export fails
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlString);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } finally {
      // Clean up temporary DOM element
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  }
};
