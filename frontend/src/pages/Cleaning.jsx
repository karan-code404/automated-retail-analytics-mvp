import React, { useState } from 'react';
import axios from 'axios';
import { 
  CheckSquare, 
  HelpCircle, 
  RefreshCw, 
  AlertCircle, 
  ShieldAlert,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

export default function Cleaning({ token, currentDataset, onCleanSuccess }) {
  const [fillMissing, setFillMissing] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [handleOutliers, setHandleOutliers] = useState('clip'); // 'clip', 'remove', 'keep'
  const [normalizeStrings, setNormalizeStrings] = useState(true);
  const [standardizeHeaders, setStandardizeHeaders] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cleanLogs, setCleanLogs] = useState(null);

  const triggerClean = async () => {
    if (!currentDataset) return;
    
    setIsLoading(true);
    setError(null);
    setCleanLogs(null);

    try {
      const response = await axios.post('http://localhost:5000/api/clean', {
        fill_missing: fillMissing,
        remove_duplicates: removeDuplicates,
        handle_outliers: handleOutliers,
        normalize_strings: normalizeStrings,
        standardize_headers: standardizeHeaders
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        setCleanLogs(response.data.logs);
        // Bubble up updated dataset details
        onCleanSuccess({
          ...currentDataset,
          cleaned: true,
          audit: response.data.audit
        });
      } else {
        throw new Error(response.data.error || 'Dataset cleaning pipeline failed.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to execute cleaning pipeline.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentDataset) {
    return (
      <div className="text-center p-12 glass-panel rounded-2xl border border-slate-800 max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Dataset Loaded</h3>
        <p className="text-sm text-slate-400 mt-2">
          Please upload a CSV, Excel, or JSON dataset on the <b>Upload Dataset</b> page first before launching the data cleaning engine.
        </p>
      </div>
    );
  }

  const { audit } = currentDataset;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Automated Data Cleaning Engine</h2>
        <p className="text-slate-400 mt-1">Configure parameters to automatically scrub missing fields, outliers, duplicate records, and standardize schemas.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/15 flex items-start space-x-3 text-red-200 shadow-md">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h5 className="font-bold text-red-400">Cleaning Execution Failure</h5>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Quality Diagnostics */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 lg:col-span-1">
          <h3 className="font-bold text-white flex items-center space-x-2 text-sm">
            <ShieldAlert className="h-4 w-4 text-teal-400" />
            <span>Dataset Quality Alerts</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">Duplicate Rows</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Identical records in dataset</p>
              </div>
              <span className={`px-2.5 py-1 rounded font-bold font-mono ${audit.duplicate_rows > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {audit.duplicate_rows}
              </span>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">Null/Missing Cells</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Empty slots filling with median</p>
              </div>
              <span className={`px-2.5 py-1 rounded font-bold font-mono ${audit.missing_count > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {audit.missing_count}
              </span>
            </div>

            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900">
              <p className="font-bold text-white">Outlier Volatilities</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Numerical cells outside 1.5×IQR</p>
              <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {Object.entries(audit.outlier_counts).map(([field, count]) => (
                  <div key={field} className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-400 truncate max-w-[120px]">{field}</span>
                    <span className={count > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Side: Cleaner Settings Toggles */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 lg:col-span-2">
          <h3 className="font-bold text-white flex items-center space-x-2 text-sm border-b border-slate-800 pb-3">
            <CheckSquare className="h-4 w-4 text-teal-400" />
            <span>Configurable Cleaning Directives</span>
          </h3>

          <div className="space-y-4">
            
            {/* Standardize Headers */}
            <label className="flex items-start space-x-3.5 p-3.5 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 border border-slate-900 cursor-pointer transition-colors duration-150">
              <input
                type="checkbox"
                checked={standardizeHeaders}
                onChange={(e) => setStandardizeHeaders(e.target.checked)}
                className="mt-1 accent-teal-400 h-4 w-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-white">Standardize Header Schemas</span>
                <p className="text-xs text-slate-400 leading-relaxed">Converts header casing to clean underscore notations and strips special characters.</p>
              </div>
            </label>

            {/* Remove Duplicates */}
            <label className="flex items-start space-x-3.5 p-3.5 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 border border-slate-900 cursor-pointer transition-colors duration-150">
              <input
                type="checkbox"
                checked={removeDuplicates}
                onChange={(e) => setRemoveDuplicates(e.target.checked)}
                className="mt-1 accent-teal-400 h-4 w-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-white">Prune Duplicate Records</span>
                <p className="text-xs text-slate-400 leading-relaxed">Deletes redundant transactions having 100% matched values to preserve analytical cardinality.</p>
              </div>
            </label>

            {/* Fill Missing */}
            <label className="flex items-start space-x-3.5 p-3.5 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 border border-slate-900 cursor-pointer transition-colors duration-150">
              <input
                type="checkbox"
                checked={fillMissing}
                onChange={(e) => setFillMissing(e.target.checked)}
                className="mt-1 accent-teal-400 h-4 w-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-white">Impute Missing Null Fields</span>
                <p className="text-xs text-slate-400 leading-relaxed">Fills numeric blank cells using the column **median** and categorical cells using the **mode**.</p>
              </div>
            </label>

            {/* Outlier Mode */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950/20 border border-slate-900 gap-3">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-white">Outlier Volatility Handling</span>
                <p className="text-xs text-slate-400 leading-relaxed">Defines logic for numeric values lying outside standard IQR bounds.</p>
              </div>
              <select
                value={handleOutliers}
                onChange={(e) => setHandleOutliers(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-2 text-xs font-semibold rounded-lg focus:outline-none focus:border-teal-500 cursor-pointer h-fit w-full sm:w-44"
              >
                <option value="clip">Clip to IQR bounds</option>
                <option value="remove">Delete outlier rows</option>
                <option value="keep">Keep raw values</option>
              </select>
            </div>

            {/* Normalize Strings */}
            <label className="flex items-start space-x-3.5 p-3.5 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 border border-slate-900 cursor-pointer transition-colors duration-150">
              <input
                type="checkbox"
                checked={normalizeStrings}
                onChange={(e) => setNormalizeStrings(e.target.checked)}
                className="mt-1 accent-teal-400 h-4 w-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-white">Normalize Casing &amp; Padding</span>
                <p className="text-xs text-slate-400 leading-relaxed">Strips trailing whitespaces and enforces standard text types on text columns.</p>
              </div>
            </label>

          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={triggerClean}
              disabled={isLoading}
              className="flex items-center space-x-2 px-8 py-3 text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl shadow-[0_0_15px_rgba(45,212,191,0.2)] transition-all duration-300 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <span>Execute Data Cleaning</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cleaning Report Logs Output */}
      {cleanLogs && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 animate-slide-up">
          <h3 className="font-bold text-white flex items-center space-x-2 text-sm">
            <ClipboardList className="h-4 w-4 text-teal-400" />
            <span>Audit Cleaning Log Report</span>
          </h3>

          <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 max-h-60 overflow-y-auto font-mono text-xs text-slate-300">
            {cleanLogs.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className="text-teal-400">[info]</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
