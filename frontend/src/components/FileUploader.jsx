import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, RefreshCw } from 'lucide-react';

export default function FileUploader({ onUploadSuccess, onUploadStart, onUploadError, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
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

  const validateAndSetFile = (file) => {
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'csv') {
      onUploadError('Invalid file type. Please upload a CSV (.csv) file.');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
    onUploadError(null); // Clear errors on valid file selection
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    onUploadStart(selectedFile);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`glass-panel relative rounded-2xl p-8 text-center border-2 border-dashed transition-all duration-300 ${
          dragActive
            ? "border-teal-400 bg-teal-950/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]Scale-102"
            : "border-slate-700 hover:border-teal-500/50 hover:bg-slate-900/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-full bg-teal-950/50 border border-teal-500/20 text-teal-400">
            {selectedFile ? (
              <FileSpreadsheet className="h-10 w-10 animate-bounce" />
            ) : (
              <Upload className="h-10 w-10 text-teal-400/80" />
            )}
          </div>

          {selectedFile ? (
            <div className="space-y-2">
              <p className="text-lg font-medium text-slate-200">
                Ready to analyze: <span className="text-teal-400 font-mono font-semibold">{selectedFile.name}</span>
              </p>
              <p className="text-xs text-slate-400">
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium text-slate-200">
                Drag and drop your retail CSV file here
              </p>
              <p className="text-sm text-slate-400">
                or
              </p>
              <button
                type="button"
                onClick={onButtonClick}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-teal-400 hover:text-teal-300 bg-teal-950/40 hover:bg-teal-900/50 border border-teal-500/30 hover:border-teal-500/60 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                Browse Files
              </button>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Supports standard retail CSVs with Date, Product, Category, Cost_Price, Selling_Price, and Sales_Amount columns.
          </p>
        </div>

        {/* Floating background gradient light */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-teal-500/5 to-purple-500/5 rounded-2xl pointer-events-none" />
      </div>

      {selectedFile && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleUpload}
            disabled={isLoading}
            className="flex items-center space-x-2 px-8 py-3 text-base font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-xl shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_25px_rgba(45,212,191,0.35)] transition-all duration-300 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Running calculations...</span>
              </>
            ) : (
              <span>Analyze Sales Data</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
