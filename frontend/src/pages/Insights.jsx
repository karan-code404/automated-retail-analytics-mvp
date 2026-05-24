import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Lightbulb, 
  AlertCircle, 
  Sparkles, 
  TrendingUp, 
  ShieldAlert, 
  Activity,
  GitBranch,
  RefreshCw,
  Gauge
} from 'lucide-react';

export default function Insights({ token, currentDataset }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insightsData, setInsightsData] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, [currentDataset]);

  const fetchInsights = async () => {
    if (!currentDataset) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/insights', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.success) {
        setInsightsData(response.data);
      } else {
        throw new Error('Failed to generate operational insights.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Error fetching analytics insights.');
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
          Please upload a CSV, Excel, or JSON dataset on the <b>Upload Dataset</b> page first before viewing analytics insights.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="h-8 w-8 text-teal-400 animate-spin" />
        <span className="text-sm text-slate-400">Running diagnostic models and root cause analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/15 flex items-start space-x-3 text-red-200 shadow-md">
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <h5 className="font-bold text-red-400">Insights Engine Failure</h5>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  const { insights, hypotheses } = insightsData;

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/30 bg-red-950/10 shadow-[0_0_15px_rgba(239,68,68,0.05)] text-red-200';
      case 'warning':
        return 'border-amber-500/30 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-amber-200';
      case 'success':
        return 'border-emerald-500/30 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.05)] text-emerald-200';
      default:
        return 'border-teal-500/30 bg-teal-950/10 shadow-[0_0_15px_rgba(20,184,166,0.05)] text-teal-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="h-6 w-6 text-red-400 animate-pulse" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-amber-400" />;
      case 'success':
        return <Sparkles className="h-6 w-6 text-emerald-400" />;
      default:
        return <Lightbulb className="h-6 w-6 text-teal-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">AI Operational Insights</h2>
          <p className="text-slate-400 mt-1">Deep diagnostics describing operational anomalies and root cause evidence.</p>
        </div>
        <button
          onClick={fetchInsights}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-colors duration-150"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Insights</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Root Cause Hypotheses */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <GitBranch className="h-5 w-5 text-teal-400" />
              <span>Root Cause Hypotheses</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Calculated confidence indicators explaining segment variances.</p>
          </div>

          <div className="space-y-4">
            {hypotheses.map((hyp, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-white leading-tight max-w-[170px]" title={hyp.title}>{hyp.title}</h4>
                  <span className="px-2 py-0.5 text-[8.5px] font-bold tracking-widest bg-slate-950 text-teal-400 border border-teal-500/20 rounded uppercase">
                    CONFIDENCE {hyp.confidence}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full" 
                      style={{ width: `${hyp.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/40">
                  <p><span className="text-teal-400 font-semibold">Hypothesis:</span> {hyp.hypothesis}</p>
                  <p className="text-slate-400"><span className="text-slate-500 font-semibold">Evidence:</span> <i>{hyp.evidence}</i></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: AI Analyst Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Activity className="h-5 w-5 text-teal-400" />
              <span>AI Analyst Intelligence Feed</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated human-like analyst commentary based on statistical parameters.</p>
          </div>

          <div className="space-y-5">
            {insights.map((ins, idx) => (
              <div 
                key={idx} 
                className={`p-6 rounded-2xl border flex gap-5 transition-all duration-300 ${getSeverityStyles(ins.severity)}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getSeverityIcon(ins.severity)}
                </div>

                <div className="space-y-3 flex-grow">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-base">{ins.title}</h4>
                    <span className="px-2 py-0.5 text-[8.5px] font-extrabold tracking-widest bg-black/30 rounded border border-white/5 uppercase">
                      {ins.severity}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs leading-relaxed">
                    <p>
                      <span className="text-slate-400 font-bold block mb-0.5 uppercase tracking-wider text-[9px]">Observation</span>
                      {ins.what}
                    </p>
                    <p>
                      <span className="text-slate-400 font-bold block mb-0.5 uppercase tracking-wider text-[9px]">Plausible Trigger</span>
                      {ins.why}
                    </p>
                    <p className="text-teal-400 font-semibold">
                      <span className="text-slate-400 font-bold block mb-0.5 uppercase tracking-wider text-[9px]">Business Impact</span>
                      {ins.impact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
