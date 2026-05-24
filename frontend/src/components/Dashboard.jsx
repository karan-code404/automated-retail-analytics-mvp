import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Percent, 
  AlertTriangle, 
  Lightbulb, 
  ArrowLeft,
  ArrowUpRight,
  Sparkles,
  CalendarDays,
  Filter
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function Dashboard({ data, onReset }) {
  const { 
    summary, 
    category_breakdown, 
    product_performance, 
    sales_trend, 
    recommendations, 
    best_product, 
    worst_product 
  } = data;

  // 1. Chart States
  const [trendScale, setTrendScale] = useState('daily'); // 'daily', 'weekly', 'monthly', 'yearly'
  const [categoryScale, setCategoryScale] = useState('overall'); // 'overall', 'weekly', 'monthly', 'yearly'
  const [selectedCategoryPeriod, setSelectedCategoryPeriod] = useState('');

  // Format currency helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatPercentage = (val) => {
    return `${val.toFixed(1)}%`;
  };

  // Get active sales trend data
  const activeTrendData = useMemo(() => {
    return sales_trend[trendScale] || [];
  }, [sales_trend, trendScale]);

  // Compute available periods for category scale
  const availableCategoryPeriods = useMemo(() => {
    if (categoryScale === 'overall') return [];
    const periods = category_breakdown[categoryScale]?.map(item => item.period) || [];
    return Array.from(new Set(periods)).sort();
  }, [category_breakdown, categoryScale]);

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
    if (categoryScale === 'overall') {
      return category_breakdown.overall || [];
    }
    return category_breakdown[categoryScale]?.filter(
      item => item.period === selectedCategoryPeriod
    ) || [];
  }, [category_breakdown, categoryScale, selectedCategoryPeriod]);

  // Get icon for recommendation type
  const getRecIcon = (type) => {
    switch (type) {
      case 'success':
        return <Sparkles className="h-6 w-6 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-400 animate-pulse" />;
      default:
        return <Lightbulb className="h-6 w-6 text-teal-400" />;
    }
  };

  // Get border and bg styles for recommendation cards
  const getRecStyles = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]';
      case 'warning':
        return 'border-amber-500/20 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.05)]';
      default:
        return 'border-teal-500/20 bg-teal-950/10 shadow-[0_0_15px_rgba(20,184,166,0.05)]';
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Analytics Insights</h2>
          <p className="text-slate-400 mt-1">Real-time performance metrics computed by our Pandas Engine.</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Upload Another File</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Total Revenue</p>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(summary.total_revenue)}</h3>
            </div>
            <div className="p-3 bg-teal-950/40 border border-teal-500/20 rounded-xl text-teal-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-400">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span>Gross Sales Figures</span>
          </div>
        </div>

        {/* Total Profit */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Net Profit</p>
              <h3 className="text-3xl font-extrabold text-teal-400 tracking-tight">{formatCurrency(summary.total_profit)}</h3>
            </div>
            <div className="p-3 bg-teal-950/40 border border-teal-500/20 rounded-xl text-teal-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-teal-400">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span>Net Operating Margin</span>
          </div>
        </div>

        {/* Total Items Sold */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Items Sold</p>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">{summary.total_items_sold.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-teal-950/40 border border-teal-500/20 rounded-xl text-teal-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-400">
            <span>Total Units Handled</span>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Profit Margin</p>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">{formatPercentage(summary.profit_margin)}</h3>
            </div>
            <div className="p-3 bg-teal-950/40 border border-teal-500/20 rounded-xl text-teal-400">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-teal-400">
            <span>Profitability Ratio</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales & Profit Trend with Scaling */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h4 className="text-lg font-bold text-white">Sales &amp; Profit Trend</h4>
              <p className="text-xs text-slate-400">Timeline analysis of revenue and net profit growth.</p>
            </div>
            
            {/* Timeline scale selector */}
            <div className="flex items-center space-x-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
              {['daily', 'weekly', 'monthly', 'yearly'].map((scale) => (
                <button
                  key={scale}
                  onClick={() => setTrendScale(scale)}
                  className={`px-3 py-1.5 text-xs font-semibold capitalize rounded-md transition-all duration-200 cursor-pointer ${
                    trendScale === scale
                      ? 'bg-teal-400 text-slate-950 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {scale === 'daily' ? 'Day' : scale === 'weekly' ? 'Week' : scale === 'monthly' ? 'Month' : 'Year'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#f8fafc' }} />
                <Area name="Revenue" type="monotone" dataKey="sales" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area name="Net Profit" type="monotone" dataKey="profit" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown comparison with Scaling & Slicing */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h4 className="text-lg font-bold text-white">Category Performance</h4>
              <p className="text-xs text-slate-400">Comparing gross revenue against profits per category.</p>
            </div>
            
            {/* Category Period Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Select scale type */}
              <div className="relative">
                <select
                  value={categoryScale}
                  onChange={(e) => setCategoryScale(e.target.value)}
                  className="appearance-none bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 pr-8 text-xs font-semibold rounded-lg focus:outline-none focus:border-teal-500 transition-colors duration-200 cursor-pointer"
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

              {/* Sub-select: Select period if not overall */}
              {categoryScale !== 'overall' && availableCategoryPeriods.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedCategoryPeriod}
                    onChange={(e) => setSelectedCategoryPeriod(e.target.value)}
                    className="appearance-none bg-teal-950/20 border border-teal-500/20 text-teal-300 px-3 py-1.5 pr-8 text-xs font-semibold rounded-lg focus:outline-none focus:border-teal-400 transition-colors duration-200 cursor-pointer"
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

          <div className="h-80 w-full">
            {activeCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeCategoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="Category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(value) => [formatCurrency(value), '']}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar name="Sales Revenue" dataKey="total_sales" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar name="Net Profit" dataKey="total_profit" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No category breakdown records for selected period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart Recommendations Section */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-teal-400" />
            <span>AI Smart Recommendations</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className={`p-6 rounded-xl border flex gap-4 transition-all duration-300 ${getRecStyles(rec.type)}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getRecIcon(rec.type)}
                </div>
                <div className="space-y-1">
                  <h5 className="font-semibold text-white">{rec.title}</h5>
                  <p className="text-sm text-slate-300">{rec.insight}</p>
                  <p className="text-sm text-teal-300 font-medium mt-2">
                    <span className="text-teal-400 font-bold">Action: </span>
                    {rec.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Product Performance Table */}
      <div className="glass-panel rounded-2xl p-6 overflow-hidden">
        <div className="mb-4">
          <h4 className="text-lg font-bold text-white">Product Performance Details</h4>
          <p className="text-xs text-slate-400">Full audit breakdown of individual items.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <th className="py-4 px-4">Product Name</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4 text-right">Units Sold</th>
                <th className="py-4 px-4 text-right">Avg Cost</th>
                <th className="py-4 px-4 text-right">Avg Price</th>
                <th className="py-4 px-4 text-right">Revenue</th>
                <th className="py-4 px-4 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
              {product_performance.map((item, index) => {
                const isBest = best_product && item.Product === best_product.name;
                const isWorst = worst_product && item.Product === worst_product.name;

                return (
                  <tr key={index} className="hover:bg-slate-900/30 transition-colors duration-150">
                    <td className="py-4 px-4 font-medium text-white flex items-center space-x-2">
                      <span>{item.Product}</span>
                      {isBest && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center">
                          Top Seller
                        </span>
                      )}
                      {isWorst && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center">
                          Underperforming
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-400">{item.Category}</td>
                    <td className="py-4 px-4 text-right font-mono">{item.units_sold}</td>
                    <td className="py-4 px-4 text-right font-mono">{formatCurrency(item.avg_cost_price)}</td>
                    <td className="py-4 px-4 text-right font-mono">{formatCurrency(item.avg_selling_price)}</td>
                    <td className="py-4 px-4 text-right font-mono text-white">{formatCurrency(item.revenue)}</td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-teal-400">{formatCurrency(item.profit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
