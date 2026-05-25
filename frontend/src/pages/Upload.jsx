import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Table as TableIcon,
  RefreshCw,
  Database,
  Grid
} from 'lucide-react';

export default function UploadPage({ token, onUploadSuccess, currentDataset }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateFile(e.target.files[0]);
    }
  };

  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'json'].includes(ext)) {
      setError('Unsupported file type. Please upload a CSV, Excel (.xlsx/.xls), or JSON file.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setError(null);
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        setSuccess(true);
        onUploadSuccess(response.data);
      } else {
        throw new Error(response.data.error || 'Failed to upload dataset.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'File upload failed. Ensure server is online.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Load Corporate Dataset</h2>
        <p className="text-slate-400 mt-1">Upload CSV, Excel, or JSON transaction ledgers to trigger auto-auditing calculations.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/15 flex items-start space-x-3 text-red-200 shadow-md">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h5 className="font-bold text-red-400">Upload Validation Error</h5>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/15 flex items-start space-x-3 text-emerald-200 shadow-md">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h5 className="font-bold text-emerald-400">Dataset Loaded Successfully</h5>
            <p className="text-sm opacity-90">Calculated parameters have been indexed in context memory. Navigate to <b>Data Cleaning</b> or <b>KPI Dashboard</b>.</p>
          </div>
        </div>
      )}

      {/* Main Upload Dropzone */}
      <div className="max-w-3xl mx-auto">
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`glass-panel relative rounded-2xl p-10 text-center border-2 border-dashed transition-all duration-300 ${
            dragActive
              ? "border-teal-400 bg-teal-950/10 shadow-[0_0_15px_rgba(20,184,166,0.1)]Scale-101"
              : "border-slate-800 hover:border-teal-500/40 hover:bg-slate-900/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv, .xlsx, .xls, .json"
            onChange={handleFileChange}
            disabled={isLoading}
          />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-teal-400">
              {selectedFile ? (
                <FileSpreadsheet className="h-10 w-10 animate-bounce" />
              ) : (
                <Upload className="h-10 w-10 text-slate-400" />
              )}
            </div>

            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-lg font-medium text-slate-200">
                  Ready to audit: <span className="text-teal-400 font-mono font-semibold">{selectedFile.name}</span>
                </p>
                <p className="text-xs text-slate-400">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-slate-200">
                  Drag and drop your spreadsheet here
                </p>
                <p className="text-sm text-slate-500">or</p>
                <button
                  type="button"
                  onClick={triggerBrowse}
                  disabled={isLoading}
                  className="px-5 py-2 text-sm font-semibold text-teal-400 hover:text-teal-300 bg-teal-950/30 hover:bg-teal-950/50 border border-teal-500/30 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  Browse Files
                </button>
              </div>
            )}

            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Supports CSV, XLSX, XLS, and JSON formats up to 10MB.
            </p>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className="flex items-center space-x-2 px-8 py-3 text-base font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl shadow-[0_0_15px_rgba(45,212,191,0.2)] transition-all duration-300 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Parsing Spreadsheet...</span>
                </>
              ) : (
                <span>Upload and Audit Profile</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Dataset Audit Profile (If loaded) */}
      {currentDataset && currentDataset.audit && (
        <div className="space-y-6 pt-6 border-t border-slate-900">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-teal-400" />
            <h3 className="text-lg font-bold text-white">Dataset Quality Summary: <span className="text-teal-400 font-mono font-normal">{currentDataset.dataset_name}</span></h3>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Rows</span>
              <span className="text-2xl font-black text-white mt-1 block">{currentDataset.audit.rows_count.toLocaleString()}</span>
            </div>
            
            <div className="glass-panel p-5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Columns</span>
              <span className="text-2xl font-black text-white mt-1 block">{currentDataset.audit.columns_count}</span>
            </div>
            
            <div className="glass-panel p-5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-semibold text-amber-500">Missing Values</span>
              <span className="text-2xl font-black text-white mt-1 block">{currentDataset.audit.missing_count.toLocaleString()}</span>
            </div>
            
            <div className="glass-panel p-5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-semibold text-amber-500">Duplicate Rows</span>
              <span className="text-2xl font-black text-white mt-1 block">{currentDataset.audit.duplicate_rows.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columns Data Types & Outliers count */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-1">
              <h4 className="font-bold text-white mb-4 text-sm flex items-center space-x-2">
                <Grid className="h-4 w-4 text-teal-400" />
                <span>Column Data Types</span>
              </h4>
              <div className="overflow-y-auto max-h-80 pr-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider pb-2">
                      <th className="pb-2">Field</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2 text-right">Outliers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {Object.entries(currentDataset.audit.data_types).map(([field, dtype]) => (
                      <tr key={field} className="hover:bg-slate-900/10">
                        <td className="py-2.5 font-medium truncate max-w-[120px]" title={field}>{field}</td>
                        <td className="py-2.5 font-mono text-[10px] text-teal-400">{dtype}</td>
                        <td className="py-2.5 text-right font-mono text-amber-400">
                          {currentDataset.audit.outlier_counts[field] || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Preview First 20 Rows */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2 flex flex-col">
              <h4 className="font-bold text-white mb-4 text-sm flex items-center space-x-2">
                <TableIcon className="h-4 w-4 text-teal-400" />
                <span>Dataset Preview (First 20 Rows)</span>
              </h4>
              
              <div className="overflow-auto flex-1 max-h-80 border border-slate-900 rounded-xl bg-slate-950/20">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/40 text-slate-400 font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      {currentDataset.audit.columns_list.map((header) => (
                        <th key={header} className="py-3 px-4 truncate max-w-[150px] border-b border-slate-900">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {currentDataset.audit.preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                        {currentDataset.audit.columns_list.map((header) => (
                          <td key={header} className="py-2.5 px-4 font-mono truncate max-w-[150px]">{row[header]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
