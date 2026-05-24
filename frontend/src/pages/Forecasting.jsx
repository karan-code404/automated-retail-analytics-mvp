import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  Info,
  CalendarDays,
  ShieldCheck
} from 'lucide-react';
import { 
  ComposedChart,
  Line,
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function Forecasting({ token, currentDataset }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  // 1. Forecast scale state
  const [forecastScale, setForecastScale] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'yearly'

  useEffect(() => {
    fetchForecast();
  }, [currentDataset]);

  const fetchForecast = async () => {
    if (!currentDataset) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/forecast', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.success) {
        setForecastData(response.data);
      } else {
        throw new Error('Failed to compute time series projections.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Error fetching forecast calculations.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get active forecast list and summary description
  const activeForecastList = useMemo(() => {
    if (!forecastData) return [];
    return forecastData.forecasts?.[forecastScale] || [];
  }, [forecastData, forecastScale]);

  const activeForecastSummary = useMemo(() => {
    if (!forecastData) return '';
    return forecastData.summaries?.[forecastScale] || '';
  }, [forecastData, forecastScale]);

  if (!currentDataset) {
    return (
      <div className="text-center p-12 glass-panel rounded-2xl border border-slate-800 max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Dataset Loaded</h3>
        <p className="text-sm text-slate-400 mt-2">
          Please upload a CSV, Excel, or JSON dataset on the <b>Upload Dataset</b> page first before viewing projections.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="h-8 w-8 text-teal-400 animate-spin" />
        <span className="text-sm text-slate-400">Fitting regression models and mapping standard errors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/15 flex items-start space-x-3 text-red-200 shadow-md">
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <h5 className="font-bold text-red-400">Forecasting Engine Failure</h5>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  const { churn_risk } = forecastData;

  const formatValue = (val) => {
    if (val === null || val === undefined) return '';
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Time Series Projections</h2>
          <p className="text-slate-400 mt-1">Projections detailing future revenue directions with confidence boundaries.</p>
        </div>
        <button
          onClick={fetchForecast}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-colors duration-150"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Recalculate Forecast</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Projections Chart with Multi-Scale Toggle */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h4 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-teal-400" />
                <span>6-Period Least-Squares Regression Forecast</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">Historical values plotted against predicted values with 95% confidence intervals.</p>
            </div>

            {/* Time-scale selector */}
            <div className="flex items-center space-x-1 p-0.5 bg-slate-950 border border-slate-900 rounded-lg">
              {['daily', 'weekly', 'monthly', 'yearly'].map((scale) => (
                <button
                  key={scale}
                  onClick={() => setForecastScale(scale)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all duration-200 cursor-pointer ${
                    forecastScale === scale
                      ? 'bg-teal-400 text-slate-950 shadow-[0_0_8px_rgba(20,184,166,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {scale === 'daily' ? 'Day' : scale === 'weekly' ? 'Week' : scale === 'monthly' ? 'Month' : 'Year'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80 w-full mt-4">
            {activeForecastList.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activeForecastList} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(val, name) => [formatValue(val), name]}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  
                  <Area 
                    name="95% Confidence Bounds" 
                    dataKey="upper" 
                    stroke="none" 
                    fill="#818cf8" 
                    fillOpacity={0.08} 
                    legendType="rect"
                  />
                  <Area 
                    dataKey="lower" 
                    stroke="none" 
                    fill="#818cf8" 
                    fillOpacity={0.08} 
                    legendType="none"
                  />
                  
                  <Line 
                    name="Historical Actuals" 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#14b8a6" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, stroke: '#070b13', strokeWidth: 1.5, fill: '#14b8a6' }}
                    activeDot={{ r: 6 }}
                    legendType="line"
                  />

                  <Line 
                    name="Regression Forecast" 
                    type="monotone" 
                    dataKey="forecast" 
                    stroke="#6366f1" 
                    strokeWidth={2.5} 
                    strokeDasharray="5 5"
                    dot={{ r: 4, stroke: '#070b13', strokeWidth: 1.5, fill: '#6366f1' }}
                    activeDot={{ r: 6 }}
                    legendType="line"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No projection records for the selected scale.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Projections Summaries */}
        <div className="space-y-6 lg:col-span-1">
          {/* Churn progress card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center space-x-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              <span>Retention Risk Evaluation</span>
            </h4>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-semibold text-white">Proxy Churn Probability</span>
                <span className={`text-xl font-black ${churn_risk > 30 ? 'text-red-400' : 'text-teal-400'}`}>
                  {churn_risk}%
                </span>
              </div>
              
              <div className="h-2 w-full bg-slate-950 rounded-full border border-slate-900 overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${churn_risk > 30 ? 'from-red-500 to-amber-400' : 'from-teal-500 to-cyan-400'}`} 
                  style={{ width: `${churn_risk}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800/40">
              Risk probability computed via date intervals and negative sales slopes. Indexing values above 30% indicates active contract/buyer retention fatigue.
            </p>
          </div>

          {/* Forecast description card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
            <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center space-x-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-teal-400" />
              <span>Model Summary Stats</span>
            </h4>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex gap-3">
                <Info className="h-4 w-4 text-teal-400 mt-0.5 flex-shrink-0" />
                <span>{activeForecastSummary}</span>
              </div>
              
              <p className="text-slate-400">
                Confidence intervals assume a standard Gaussian distribution error around the regression line, mapping out the 95% variance prediction limits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
