import React, { useState } from 'react';
import axios from 'axios';
import { 
  FileText, 
  FileSpreadsheet, 
  Tv, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Download,
  Package
} from 'lucide-react';

export default function Export({ token, currentDataset }) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successFormat, setSuccessFormat] = useState(null);

  const triggerExport = async (format) => {
    if (!currentDataset) return;
    
    setIsLoading(true);
    setProgress(5);
    setError(null);
    setSuccessFormat(null);

    let progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const step = prev < 40 ? 12 : prev < 70 ? 6 : 2;
        return prev + step;
      });
    }, 350);

    try {
      const response = await axios.post('http://localhost:5000/api/export', {
        format: format
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Essential for receiving binary files!
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Determine file extension
      const fileExtension = format === 'pdf' ? 'pdf' : format === 'docx' ? 'docx' : format === 'pptx' ? 'pptx' : 'zip';
      const cleanName = currentDataset.dataset_name.split('.')[0];
      const filename = format === 'pack' 
        ? `consulting_pack_${cleanName}.zip`
        : `corporate_report_${cleanName}.${fileExtension}`;
      
      // Trigger native browser download
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] 
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessFormat(format === 'pack' ? 'ZIP Consulting Pack' : format.toUpperCase());
    } catch (err) {
      console.error(err);
      setError('Failed to compile report. Ensure that the ReportLab and PPT/DOCX modules are installed on the server.');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 700);
    }
  };

  if (!currentDataset) {
    return (
      <div className="text-center p-12 glass-panel rounded-2xl border border-slate-800 max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Dataset Loaded</h3>
        <p className="text-sm text-slate-400 mt-2">
          Please upload a CSV, Excel, or JSON dataset on the <b>Upload Dataset</b> page first before exporting reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Executive Compilation Suite</h2>
        <p className="text-slate-400 mt-1">Compile and download board-ready summaries, slide decks, and comprehensive packages.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/15 flex items-start space-x-3 text-red-200 shadow-md">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h5 className="font-bold text-red-400">Compilation Error</h5>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {successFormat && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/15 flex items-start space-x-3 text-emerald-200 shadow-md">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h5 className="font-bold text-emerald-400">Export Complete</h5>
            <p className="text-sm opacity-90">Successfully compiled and downloaded the **{successFormat}**.</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3 max-w-5xl mx-auto shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-400" />
              <span className="font-semibold text-teal-400">Compiling Report Assets...</span>
            </span>
            <span className="font-bold text-teal-400">{progress}% Complete</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800/40">
            <div 
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(20,184,166,0.3)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Processing dataset structure, compiling regression statistics, fitting confidence boundaries, generating PDF layouts, and packing binaries. Please do not close this window.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        
        {/* PDF Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700/60 transition-colors duration-150 shadow-md">
          <div className="space-y-3">
            <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-400 w-fit">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Executive PDF Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates a styled, 53-page A4 corporate report featuring cover, Table of Contents, math methodologies, KPI summaries, and detailed regressions.
            </p>
          </div>
          
          <button
            onClick={() => triggerExport('pdf')}
            disabled={isLoading}
            className="w-full py-3 px-4 flex items-center justify-center space-x-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>Compile PDF Report</span>
          </button>
        </div>

        {/* DOCX Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700/60 transition-colors duration-150 shadow-md">
          <div className="space-y-3">
            <div className="p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl text-blue-400 w-fit">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Board Word Document</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Creates a structured 20-section `.docx` file formatted for stakeholder comments, edits, and tracked changes, complete with tables.
            </p>
          </div>

          <button
            onClick={() => triggerExport('docx')}
            disabled={isLoading}
            className="w-full py-3 px-4 flex items-center justify-center space-x-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>Compile Word Doc</span>
          </button>
        </div>

        {/* PPTX Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700/60 transition-colors duration-150 shadow-md">
          <div className="space-y-3">
            <div className="p-3 bg-amber-950/40 border border-amber-500/20 rounded-xl text-amber-400 w-fit">
              <Tv className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Executive Slide Deck</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Produces a classroom-ready 20-slide `.pptx` presentation outlining the cover, KPI velocity breakdowns, forecast parameters, and roadmap.
            </p>
          </div>

          <button
            onClick={() => triggerExport('pptx')}
            disabled={isLoading}
            className="w-full py-3 px-4 flex items-center justify-center space-x-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>Compile Slide Deck</span>
          </button>
        </div>

        {/* ZIP consulting pack Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700/60 transition-colors duration-150 shadow-md ring-1 ring-teal-500/20">
          <div className="space-y-3">
            <div className="p-3 bg-teal-950/40 border border-teal-500/25 rounded-xl text-teal-400 w-fit">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">ZIP Consulting Pack</h3>
            <p className="text-xs text-slate-400 leading-relaxed text-teal-100/90">
              Generates PDF, DOCX, and PPTX reports concurrently, packages them inside a single ZIP archive, and downloads it in one go.
            </p>
          </div>

          <button
            onClick={() => triggerExport('pack')}
            disabled={isLoading}
            className="w-full py-3 px-4 flex items-center justify-center space-x-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:brightness-110 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 text-slate-950" />
            <span>Download All in One</span>
          </button>
        </div>

      </div>
    </div>
  );
}
