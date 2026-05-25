import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertCircle, 
  LineChart as LineIcon, 
  BarChart as BarIcon, 
  PieChart as PieIcon,
  RefreshCw,
  SlidersHorizontal,
  CalendarDays,
  Filter
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function KPIDashboard({ token, currentDataset }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashData, setDashData] = useState(null);

  // 1. Interactive chart states
  const [trendScale, setTrendScale] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'yearly'
  const [categoryScale, setCategoryScale] = useState('overall'); // 'overall', 'weekly', 'monthly', 'yearly'
  const [selectedCategoryPeriod, setSelectedCategoryPeriod] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [currentDataset]);

  const fetchDashboardData = async () => {
    if (!currentDataset) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.success) {
        setDashData(response.data);
      } else {
        throw new Error('Failed to compute dashboard metrics.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Error fetching analytics dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Compute active trend data based on selected scale
  const activeTrendData = useMemo(() => {
    if (!dashData) return [];
    return dashData.time_breakdowns?.[trendScale] || [];
  }, [dashData, trendScale]);

  // Compute available periods for category scale
  const availableCategoryPeriods = useMemo(() => {
    if (!dashData || categoryScale === 'overall') return [];
    const periods = dashData.category_breakdown?.[categoryScale]?.map(item => item.period) || [];
    return Array.from(new Set(periods)).sort();
  }, [dashData, categoryScale]);

  // Set default period on scale change
  useEffect(() => {
    if (availableCategoryPeriods.length > 0) {
      setSelectedCategoryPeriod(availableCategoryPeriods[availableCategoryPeriods.length - 1]); // Default to latest period
    } else {
      setSelectedCategoryPeriod('');
    }
  }, [categoryScale, availableCategoryPeriods]);

  // Filter category breakdown chart data
  const activeCategoryData = useMemo(() => {
    if (!dashData) return [];
    if (categoryScale === 'overall') {
      return dashData.category_breakdown?.overall || [];
    }
    const filtered = dashData.category_breakdown?.[categoryScale]?.filter(
      item => item.period === selectedCategoryPeriod
    ) || [];
    
    // Standardize key names for Recharts to read easily
    return filtered.map(item => ({
      name: item.Category,
      value: item.total_sales,
      count: item.units_sold
    }));
  }, [dashData, categoryScale, selectedCategoryPeriod]);

  if (!currentDataset) {
    return (
      <div className="text-center p-12 glass-panel rounded-2xl border border-slate-800 max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Dataset Loaded</h3>
        <p className="text-sm text-slate-400 mt-2">
          Please upload a CSV, Excel, or JSON dataset on the <b>Upload Dataset</b> page first before viewing the dashboard.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="h-8 w-8 text-teal-400 animate-spin" />
        <span className="text-sm text-slate-400">Computing business metrics and visualizations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/15 flex items-start space-x-3 text-red-200 shadow-md">
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <h5 className="font-bold text-red-400">Dashboard Computation Failure</h5>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  const { domain, kpis, correlations, category_column, metric_column } = dashData;

  const CHART_COLORS = ['#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-400 mr-1" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-400 mr-1" />;
    return <Minus className="h-4 w-4 text-slate-500 mr-1" />;
  };

  const getTrendClass = (trend) => {
    if (trend === 'up') return 'text-emerald-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-slate-500';
  };

  const getCorrBg = (val) => {
    if (val > 0.7) return 'bg-teal-950/90 text-teal-300 border-teal-500/30';
    if (val > 0.4) return 'bg-teal-950/40 text-teal-400 border-teal-500/10';
    if (val < -0.7) return 'bg-rose-950/90 text-rose-300 border-rose-500/30';
    if (val < -0.4) return 'bg-rose-950/40 text-rose-400 border-rose-500/10';
    return 'bg-slate-900/60 text-slate-500 border-slate-800';
  };

  const corrVariables = Array.from(new Set(correlations.map(c => c.x)));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Dashboard Sub-header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Audited Business Indicators</h2>
          <p className="text-slate-400 mt-1">
            Core segment calculations for the detected business domain: <span className="text-teal-400 font-bold uppercase">{domain}</span>.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-colors duration-150"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((k, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{k.title}</p>
                <h3 className="text-3xl font-extrabold text-white tracking-tight">{k.value}</h3>
              </div>
              <span className="px-2 py-0.5 text-[8.5px] font-bold tracking-wider bg-slate-900 text-teal-400 border border-teal-500/20 rounded">
                {k.badge}
              </span>
            </div>
            {k.change && (
              <div className="mt-4 flex items-center text-xs font-mono">
                {getTrendIcon(k.trend)}
                <span className={getTrendClass(k.trend)}>{k.change} vs H1 Baseline</span>
              </div>
            )}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/3 to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Timeline Trends Chart with scaling */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h4 className="text-base font-bold text-white flex items-center space-x-2">
                <LineIcon className="h-4 w-4 text-teal-400" />
                <span>Timeline Transaction Value</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">Aggregated gross value trajectory.</p>
            </div>

            {/* Timeline scale selector */}
            <div className="flex items-center space-x-1 p-0.5 bg-slate-950 border border-slate-900 rounded-lg">
              {['daily', 'weekly', 'monthly', 'yearly'].map((scale) => (
                <button
                  key={scale}
                  onClick={() => setTrendScale(scale)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all duration-200 cursor-pointer ${
                    trendScale === scale
                      ? 'bg-teal-400 text-slate-950 shadow-[0_0_8px_rgba(20,184,166,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {scale === 'daily' ? 'Day' : scale === 'weekly' ? 'Week' : scale === 'monthly' ? 'Month' : 'Year'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            {activeTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Area name={metric_column?.replace('_', ' ')} type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No time-series data available for the selected scale.
              </div>
            )}
          </div>
        </div>

        {/* Categorical Breakdown BarChart with scaling/filtering */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h4 className="text-base font-bold text-white flex items-center space-x-2">
                <BarIcon className="h-4 w-4 text-teal-400" />
                <span>Segment Contribution: {category_column}</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">Sub-categories value comparison.</p>
            </div>

            {/* Category Period Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={categoryScale}
                  onChange={(e) => setCategoryScale(e.target.value)}
                  className="appearance-none bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 pr-8 text-[10px] font-bold rounded-lg focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="overall">Overall</option>
                  <option value="weekly">By Week</option>
                  <option value="monthly">By Month</option>
                  <option value="yearly">By Year</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <Filter className="h-3 w-3" />
                </div>
              </div>

              {categoryScale !== 'overall' && availableCategoryPeriods.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedCategoryPeriod}
                    onChange={(e) => setSelectedCategoryPeriod(e.target.value)}
                    className="appearance-none bg-teal-950/20 border border-teal-500/20 text-teal-300 px-3 py-1.5 pr-8 text-[10px] font-bold rounded-lg focus:outline-none focus:border-teal-400 cursor-pointer"
                  >
                    {availableCategoryPeriods.map((period) => (
                      <option key={period} value={period} className="bg-slate-950 text-slate-200">
                        {period}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-teal-400">
                    <CalendarDays className="h-3 w-3" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-72 w-full">
            {activeCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeCategoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar name={metric_column?.replace('_', ' ')} dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No segment records for the selected filters.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Ratios & Correlation Matrix Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Volume distribution PieChart (uses activeCategoryData!) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-1 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="text-base font-bold text-white flex items-center space-x-2">
              <PieIcon className="h-4 w-4 text-teal-400" />
              <span>Volume Ratio</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Transaction share of categories in current selection.</p>
          </div>

          <div className="h-64 w-full relative">
            {activeCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {activeCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No ratios to display.
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 mt-2">
            {activeCategoryData.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                <span className="truncate max-w-[80px]">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Correlation Heatmap Grid */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="text-base font-bold text-white flex items-center space-x-2">
              <SlidersHorizontal className="h-4 w-4 text-teal-400" />
              <span>Pearson Correlation Heatmap Matrix</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Dependency matrix coefficient values.</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4">
            {corrVariables.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[400px]">
                  <div className="grid grid-cols-[120px_1fr] gap-1.5 mb-1.5">
                    <div />
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${corrVariables.length}, 1fr)` }}>
                      {corrVariables.map(v => (
                        <div key={v} className="text-[10px] font-mono text-slate-500 font-bold text-center truncate px-1" title={v}>
                          {v.replace('_', ' ')}
                        </div>
                      ))}
                    </div>
                  </div>

                  {corrVariables.map(varY => (
                    <div key={varY} className="grid grid-cols-[120px_1fr] gap-1.5 items-center mb-1.5">
                      <div className="text-[10px] font-mono text-slate-300 font-bold truncate text-right pr-2" title={varY}>
                        {varY.replace('_', ' ')}
                      </div>
                      
                      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${corrVariables.length}, 1fr)` }}>
                        {corrVariables.map(varX => {
                          const corrCell = correlations.find(c => c.x === varX && c.y === varY) || { value: 0 };
                          return (
                            <div 
                              key={`${varX}-${varY}`}
                              className={`h-11 border text-xs font-semibold font-mono rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 ${getCorrBg(corrCell.value)}`}
                              title={`${varY} vs ${varX} = ${corrCell.value}`}
                            >
                              {corrCell.value.toFixed(2)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-10">
                Correlation matrix requires numeric columns.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
