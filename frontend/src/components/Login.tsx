import React, { useState } from 'react';
import { useAppDispatch } from '../store/hooks.js';
import { setUser } from '../store/authSlice.js';
import { API_BASE } from '../config.js';

interface LoginProps {
  initialIsRegister?: boolean;
  onBack?: () => void;
}

export default function Login({ initialIsRegister = false, onBack }: LoginProps) {
  const dispatch = useAppDispatch();
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [registerRole, setRegisterRole] = useState<'CUSTOMER' | 'DRIVER'>('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { name, email, password, role: registerRole } : { email, password };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `${isRegister ? "Registration" : "Login"} failed`);
      } else {
        if (isRegister) {
          setIsRegister(false);
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setSuccessMsg("Registration successful! Please sign in.");
        } else {
          dispatch(setUser(data.user));
          setEmail("");
          setPassword("");
          setConfirmPassword("");
        }
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="min-h-[100dvh] w-screen flex flex-col items-center py-12 px-4 overflow-y-auto bg-transparent relative z-0 font-body">
      <form onSubmit={handleSubmit} className="w-full max-w-[400px] my-auto card border border-white/[0.06] bg-bg-surface backdrop-blur-xl p-6 md:p-10 flex flex-col gap-5">
        <div className="text-center relative">
          {onBack && (
            <button 
              type="button" 
              onClick={onBack}
              className="absolute left-0 top-0.5 text-zinc-500 hover:text-zinc-200 transition-colors p-1"
              aria-label="Back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
          )}
          <h1 className="font-display text-xl font-bold text-zinc-100 tracking-tight mb-1">
            {isRegister 
              ? (registerRole === 'CUSTOMER' ? "Customer Registration" : "Driver Registration")
              : "Sign In"}
          </h1>
          <p className="text-xs text-zinc-500">
            {isRegister 
              ? `Create your ${registerRole.toLowerCase()} account` 
              : "Enter your credentials"}
          </p>
        </div>

        {isRegister && (
          <div className="flex p-1 bg-white/[0.03] rounded-lg border border-white/[0.05]">
            <button
              type="button"
              onClick={() => setRegisterRole('CUSTOMER')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                registerRole === 'CUSTOMER' 
                  ? 'bg-brand-primary text-zinc-950 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setRegisterRole('DRIVER')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                registerRole === 'DRIVER' 
                  ? 'bg-brand-primary text-zinc-950 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Driver
            </button>
          </div>
        )}

        {isRegister && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-zinc-500 tracking-wide">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="glass-input p-3"
              required 
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-zinc-500 tracking-wide">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="glass-input p-3"
            required 
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-zinc-500 tracking-wide">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="glass-input p-3"
            required 
          />
        </div>

        {isRegister && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-zinc-500 tracking-wide">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="glass-input p-3"
              required 
            />
          </div>
        )}

        {error && <p className="text-status-danger text-xs font-medium text-center">{error}</p>}
        {successMsg && <p className="text-emerald-500 text-xs font-medium text-center">{successMsg}</p>}

        <button type="submit" className="glass-button p-3 mt-1">
          {isRegister ? "Create Account" : "Continue"}
        </button>
        
        <div className="text-center text-xs text-zinc-500 mt-1">
          {isRegister ? (
            <>
              Have an account?{' '}
              <button type="button" onClick={() => { setIsRegister(false); setError(''); setSuccessMsg(''); }} className="text-brand-primary font-medium hover:text-brand-accent cursor-pointer bg-transparent border-none p-0 transition-colors">Sign In</button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={() => { setIsRegister(true); setError(''); setSuccessMsg(''); }} className="text-brand-primary font-medium hover:text-brand-accent cursor-pointer bg-transparent border-none p-0 transition-colors">Register</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
