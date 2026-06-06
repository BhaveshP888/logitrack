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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { name, email, password } : { email, password };

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
        dispatch(setUser(data.user));
        setEmail("")
        setPassword("")
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent relative z-0 font-body">
      <form onSubmit={handleSubmit} className="w-[400px] card border border-white/[0.06] bg-bg-surface backdrop-blur-xl p-10 flex flex-col gap-5">
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
            {isRegister ? "Driver Registration" : "Sign In"}
          </h1>
          <p className="text-xs text-zinc-500">
            {isRegister ? "Create your driver account" : "Enter your credentials"}
          </p>
        </div>

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

        {error && <p className="text-status-danger text-xs font-medium">{error}</p>}

        <button type="submit" className="glass-button p-3 mt-1">
          {isRegister ? "Create Account" : "Continue"}
        </button>
        
        <div className="text-center text-xs text-zinc-500 mt-1">
          {isRegister ? (
            <>
              Have an account?{' '}
              <button type="button" onClick={() => { setIsRegister(false); setError(''); }} className="text-brand-primary font-medium hover:text-brand-accent cursor-pointer bg-transparent border-none p-0 transition-colors">Sign In</button>
            </>
          ) : (
            <>
              New driver?{' '}
              <button type="button" onClick={() => { setIsRegister(true); setError(''); }} className="text-brand-primary font-medium hover:text-brand-accent cursor-pointer bg-transparent border-none p-0 transition-colors">Register</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
