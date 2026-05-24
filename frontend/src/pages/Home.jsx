import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UploadCloud, 
  CheckSquare, 
  LayoutDashboard, 
  Lightbulb, 
  TrendingUp, 
  FileText,
  ShieldCheck,
  Terminal,
  ChevronRight
} from 'lucide-react';

export default function Home({ user }) {
  const steps = [
    { title: "1. Dataset Upload", desc: "Drag and drop CSV, Excel (XLSX), or JSON spreadsheets. Visualizes preview rows, missing counts, and column types.", icon: UploadCloud, path: "/upload", color: "text-teal-400" },
    { title: "2. Clean Engine", desc: "Exposes duplicates and outlier values. Interactively cleans datatypes, caps outliers, and fills null fields using median values.", icon: CheckSquare, path: "/cleaning", color: "text-cyan-400" },
    { title: "3. KPI Dashboard", desc: "Auto-detects business domain (Sales, Marketing, Retention) and populates dedicated KPI summaries with timelines.", icon: LayoutDashboard, path: "/kpis", color: "text-emerald-400" },
    { title: "4. AI Analyst Insights", desc: "Narrates operational spikes, explains root causes via segment comparisons, and scores hypotheses with confidence indicators.", icon: Lightbulb, path: "/insights", color: "text-purple-400" },
    { title: "5. Forecast Projections", desc: "Fits Linear Regression models over transaction history, predicting future periods with 95% confidence intervals.", icon: TrendingUp, path: "/forecasting", color: "text-amber-400" },
    { title: "6. Executive Export", desc: "Compiles C-level printable executive reports including Cover, KPIs, Outliers audit, Forecast sheets, and PDF/Word downloads.", icon: FileText, path: "/export", color: "text-sky-400" }
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Welcome banner */}
      <div className="glass-panel rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 max-w-xl z-10">
          <span className="px-3 py-1 text-[10px] font-bold tracking-widest bg-teal-950/70 text-teal-400 border border-teal-500/30 rounded-full uppercase">
            Active Workspace
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Welcome back, <span className="text-teal-400">{user?.username}</span>
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Ready to compile your executive audit? Upload transaction records, execute standardized data cleaning, and download board-ready summaries immediately.
          </p>
          <div className="pt-2">
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl shadow-[0_0_15px_rgba(45,212,191,0.2)] transition-all duration-300 cursor-pointer"
            >
              <span>Begin Report Audit</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* System telemetry box */}
        <div className="glass-card rounded-2xl p-6 w-full md:w-80 border border-slate-800/80 space-y-4">
          <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Engine Telemetry</h4>
          
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
              <span className="text-slate-500">Service Status</span>
              <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Operational</span>
              </span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
              <span className="text-slate-500">Calculation Core</span>
              <span className="text-slate-300 font-mono">Python Flask + Pandas</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Forecasting Engine</span>
              <span className="text-slate-300 font-mono">Least-Squares Regression</span>
            </div>
          </div>
        </div>

        {/* Decorative corner light */}
        <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none" />
      </div>

      {/* Grid of Steps */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white">Analytics Pipeline</h3>
          <p className="text-xs text-slate-400 mt-1">Navigate through our sequential auditing modules using the sidebar or links below.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Link 
                key={idx}
                to={step.path}
                className="glass-panel p-6 rounded-2xl border border-slate-800/80 hover:border-teal-500/40 hover:bg-slate-900/30 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className={`p-3 rounded-xl bg-slate-900 w-fit border border-slate-800 group-hover:border-teal-500/20 group-hover:bg-teal-950/20 transition-colors duration-200 ${step.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-white group-hover:text-teal-300 transition-colors duration-200">{step.title}</h4>
                  <p className="text-xs leading-relaxed text-slate-400">{step.desc}</p>
                </div>
                <div className="mt-4 flex items-center space-x-1 text-[11px] font-bold text-teal-400/80 group-hover:text-teal-400 group-hover:underline pt-2">
                  <span>Enter Module</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
