import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sparkles, 
  AlertCircle,
  TrendingUp,
  Gauge,
  Briefcase,
  RefreshCw,
  Zap
} from 'lucide-react';

export default function Recommendations({ token, currentDataset }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recsData, setRecsData] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, [currentDataset]);

  const fetchRecommendations = async () => {
    if (!currentDataset) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.success) {
        setRecsData(response.data);
      } else {
        throw new Error('Failed to generate commercial recommendations.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Error fetching recommendations.');
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
          Please upload a CSV, Excel, or JSON dataset on the <b>Upload Dataset</b> page first before viewing recommendations.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="h-8 w-8 text-teal-400 animate-spin" />
        <span className="text-sm text-slate-400">Compiling commercial action plan and ROI models...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/15 flex items-start space-x-3 text-red-200 shadow-md">
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <h5 className="font-bold text-red-400">Recommendations Engine Failure</h5>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  const { recommendations } = recsData;

  const getPriorityBadge = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const getComplexityBadge = (comp) => {
    switch (comp.toLowerCase()) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-amber-400';
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Strategic Recommendations</h2>
          <p className="text-slate-400 mt-1">High-impact operational and marketing changes to maximize commercial efficiency.</p>
        </div>
        <button
          onClick={fetchRecommendations}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-colors duration-150"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Recommendations</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec, idx) => (
          <div 
            key={idx} 
            className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden group"
          >
            {/* Upper: Header, Priority & Action */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`px-2.5 py-0.5 text-[9px] font-bold tracking-wider rounded border uppercase ${getPriorityBadge(rec.priority)}`}>
                  {rec.priority} Priority
                </span>
                <span className="text-[10px] text-teal-400 font-mono font-bold flex items-center">
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  {rec.roi}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white leading-tight group-hover:text-teal-300 transition-colors duration-200">{rec.action}</h3>
              <p className="text-xs text-slate-300 leading-relaxed"><span className="text-slate-500 font-semibold">Reasoning:</span> {rec.reason}</p>
            </div>

            {/* Lower: Impact & complexity */}
            <div className="pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Expected Impact</span>
                <span className="text-teal-400 font-semibold leading-tight block">{rec.impact}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Complexity</span>
                <span className={`font-semibold leading-tight block ${getComplexityBadge(rec.complexity)}`}>{rec.complexity} Complexity</span>
              </div>
            </div>

            {/* Glowing background */}
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-tr from-teal-500/5 to-transparent rounded-full pointer-events-none group-hover:scale-155 transition-transform duration-500" />
          </div>
        ))}
      </div>
    </div>
  );
}
