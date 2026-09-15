import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  Cpu, 
  X, 
  Share2, 
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';
import { ReportItem } from '../../types';
import { SatQueryApiService } from '../../services/apiService';
import { PdfReportService } from '../../services/pdfReportService';

interface ReportsViewProps {
  customReports?: ReportItem[];
  onNewAnalysis?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ customReports = [], onNewAnalysis }) => {
  const [serverReports, setServerReports] = useState<ReportItem[]>([]);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    let mounted = true;
    SatQueryApiService.getReports().then(reps => {
      if (mounted && reps && reps.length > 0) {
        const mapped: ReportItem[] = reps.map(r => ({
          id: r.id,
          title: r.title,
          query: r.query,
          date: r.date,
          task: r.task,
          confidence: r.confidence,
          answer: r.answer,
          modelsUsed: r.modelsUsed,
          executionTime: r.executionTime,
          status: (r.status as any) || 'Generated',
          inputSummary: r.inputSummary,
          evidenceVisual: r.evidenceVisual,
          tags: r.tags,
        }));
        setServerReports(mapped);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Only real reports: custom session reports and backend stored reports (no dummies)
  const allReports = [...customReports, ...serverReports];
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(allReports[0] || null);

  useEffect(() => {
    if (!selectedReport && allReports.length > 0) {
      setSelectedReport(allReports[0]);
    } else if (selectedReport && !allReports.some(r => r.id === selectedReport.id) && allReports.length > 0) {
      setSelectedReport(allReports[0]);
    }
  }, [allReports, selectedReport]);

  const handleDownloadPdf = async (report: ReportItem) => {
    try {
      setIsDownloadingPdf(true);
      await PdfReportService.downloadReportPdf(report);
    } catch (err) {
      console.error('Error downloading PDF report:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
            Saved Analysis Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate, preview, and download structured analysis reports.
          </p>
        </div>
      </div>

      {/* Main Content: Empty State or Grid (Reports List + Preview) */}
      {allReports.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <FileText className="w-7 h-7 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Saved Reports Yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Run an analysis in the New Analysis workspace and click "Save Report" to generate and archive official reports here.
            </p>
          </div>
          {onNewAnalysis && (
            <button
              onClick={onNewAnalysis}
              className="btn-gradient btn-shine px-5 py-2 text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start New Analysis</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 4 cols: Reports List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Available Reports ({allReports.length})
            </div>

            <div className="space-y-2.5">
              {allReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-150 border text-left ${
                    selectedReport?.id === report.id
                      ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-200'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-blue-700 font-bold">{report.task}</span>
                    <span className="text-slate-400">{report.date.split(' ')[0]}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {report.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    "{report.query}"
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-600 font-bold">
                      {report.confidence}% Conf.
                    </span>
                    <span className="text-slate-400">{report.executionTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 8 cols: Detailed Report Preview Document */}
          {selectedReport ? (
            <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
              {/* Top Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    {selectedReport.task}
                  </span>
                  <span className="text-xs text-slate-500">ID: {selectedReport.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintReport}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 text-xs font-semibold flex items-center gap-1.5 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(selectedReport)}
                    disabled={isDownloadingPdf}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    {isDownloadingPdf ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            {/* Document Header */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {selectedReport.title}
              </h2>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <span>Date: <strong>{selectedReport.date}</strong></span>
                <span>Processing Time: <strong>{selectedReport.executionTime}</strong></span>
                <span>Status: <strong className="text-emerald-600">{selectedReport.status}</strong></span>
              </div>
            </div>

            {/* 1. Query & Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Question:</span>
                <span className="text-slate-900 font-semibold">"{selectedReport.query}"</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Input Images:</span>
                <span className="text-slate-900 font-semibold">{selectedReport.inputSummary}</span>
              </div>
            </div>

            {/* 2. Analysis Answer & Confidence */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-blue-700">
                  Answer
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {selectedReport.confidence}% Confidence
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 leading-relaxed">
                {selectedReport.answer}
              </p>
            </div>

            {/* 3. Visual Evidence Snapshot */}
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-slate-500 block">
                Visual Results Snapshot:
              </span>
              <div
                className="h-44 sm:h-52 rounded-xl relative overflow-hidden border border-slate-200 p-4 flex flex-col justify-between"
                style={{
                  background: selectedReport.evidenceVisual
                    ? (selectedReport.evidenceVisual.startsWith('http') || selectedReport.evidenceVisual.startsWith('/')
                        ? `url("${selectedReport.evidenceVisual}") center/cover no-repeat`
                        : selectedReport.evidenceVisual)
                    : 'linear-gradient(135deg, #0f172a, #0369a1)'
                }}
              >
                <div className="absolute inset-0 geo-grid-pattern opacity-30 pointer-events-none" />
                <span className="relative z-10 px-2.5 py-0.5 rounded bg-slate-950/80 text-xs text-slate-200 self-start">
                  Detection Map
                </span>
                <span className="relative z-10 text-xs text-white font-bold bg-slate-950/90 px-3 py-1 rounded self-end">
                  Task: {selectedReport.task}
                </span>
              </div>
            </div>

            {/* 4. Models Used & Execution Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Models & Tools Used:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedReport.modelsUsed.map((m, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-blue-700 font-bold">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <span>Validation: Standard Quality Assurance Verification</span>
                <span className="text-emerald-600 font-bold">Verified</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Select a report on the left to view details
          </div>
        )}
      </div>
      )}
    </div>
  );
};
