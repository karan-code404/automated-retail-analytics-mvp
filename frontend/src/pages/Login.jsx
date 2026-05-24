import React, { useState } from 'react';
import axios from 'axios';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  AlertCircle,
  TrendingUp,
  Fingerprint
} from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Register Validation
    if (isRegister) {
      if (!username || !email || !password) {
        setError('Please fill in all registration fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else {
      // Login Validation
      if (!email || !password) {
        setError('Please enter your credentials.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        // Register API Request
        const response = await axios.post('http://localhost:5000/api/auth/register', {
          username,
          email,
          password
        });
        setSuccessMsg(response.data.message || 'Registration successful! Please login.');
        setIsRegister(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        // Login API Request
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          username_or_email: email,
          password
        });
        
        if (response.data && response.data.success) {
          onLoginSuccess(response.data.user, response.data.token);
        } else {
          throw new Error('Authentication failed.');
        }
      }
    } catch (err) {
      console.error('Auth error details:', err);
      setError(err.response?.data?.error || err.message || 'Authentication request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setSuccessMsg(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070b13] relative overflow-hidden px-4">
      {/* Dynamic Glowing background circles */}
      <div className="absolute top-[-15%] left-[-15%] w-[45%] h-[45%] rounded-full bg-teal-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[45%] h-[45%] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      {/* Main card box */}
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl relative z-10 border border-slate-800">
        
        {/* Logo / Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="p-3 bg-gradient-to-tr from-teal-400 to-cyan-500 rounded-2xl text-slate-950 font-black shadow-[0_0_20px_rgba(20,184,166,0.35)]">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              CORP<span className="text-teal-400">ANALYTICS</span>
            </h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">Enterprise Analytics Portal</p>
          </div>
        </div>

        {/* Dynamic Alerts */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl border border-red-500/20 bg-red-950/15 flex items-start space-x-2.5 text-red-200">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/15 flex items-start space-x-2.5 text-emerald-200">
            <Fingerprint className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 pl-11 text-sm text-slate-200 focus:outline-none transition-colors duration-200"
                  placeholder="Enter a username"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              {isRegister ? 'Email Address' : 'Email or Username'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 pl-11 text-sm text-slate-200 focus:outline-none transition-colors duration-200"
                placeholder={isRegister ? "name@company.com" : "Username or email"}
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 pl-11 text-sm text-slate-200 focus:outline-none transition-colors duration-200"
                placeholder="••••••••"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 pl-11 text-sm text-slate-200 focus:outline-none transition-colors duration-200"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-3 px-4 flex items-center justify-center space-x-2 text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl shadow-[0_0_15px_rgba(45,212,191,0.2)] hover:shadow-[0_0_20px_rgba(45,212,191,0.35)] transition-all duration-300 cursor-pointer disabled:opacity-50"
          >
            <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
          <p className="text-xs text-slate-400">
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}
            <button
              onClick={toggleAuthMode}
              className="ml-1 text-teal-400 hover:text-teal-300 font-bold hover:underline focus:outline-none cursor-pointer"
            >
              {isRegister ? 'Sign In' : 'Create an Account'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
