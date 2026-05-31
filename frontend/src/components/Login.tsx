import React, { useState } from 'react';
import { useAppDispatch } from '../store/hooks.js';
import { setUser } from '../store/authSlice.js';

export default function Login() {
  const dispatch = useAppDispatch();
  const [isRegister, setIsRegister] = useState(false);
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
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `${isRegister ? "Registration" : "Login"} failed`);
      } else {
        dispatch(setUser(data.user));
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg-main font-body">
      <form onSubmit={handleSubmit} className="w-[400px] bg-bg-surface border border-border-color rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-slate-100 tracking-tight mb-1">
            {isRegister ? "Driver Registration" : "LogiTrack Command"}
          </h1>
          <p className="text-xs text-slate-400">
            {isRegister ? "Create a new driver account to start tracking deliveries" : "Enter your credentials to enter the logistics hub"}
          </p>
        </div>

        {isRegister && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Driver Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="px-3.5 py-2.5 bg-bg-main border border-border-color rounded-lg text-slate-100 text-sm outline-none transition focus:border-brand-primary"
              required 
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="px-3.5 py-2.5 bg-bg-main border border-border-color rounded-lg text-slate-100 text-sm outline-none transition focus:border-brand-primary"
            required 
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-3.5 py-2.5 bg-bg-main border border-border-color rounded-lg text-slate-100 text-sm outline-none transition focus:border-brand-primary"
            required 
          />
        </div>

        {error && <p className="text-status-danger text-xs font-semibold">{error}</p>}

        <div className="flex flex-col gap-2">
          <button type="submit" className="py-3 px-4 rounded-lg bg-brand-primary text-white font-semibold text-sm cursor-pointer transition hover:bg-blue-600">
            {isRegister ? "Register & Enter" : "Secure Entry"}
          </button>
          
          <div className="text-center text-xs text-slate-400 mt-2">
            {isRegister ? (
              <>
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className="text-brand-primary font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                New driver?{' '}
                <button 
                  type="button" 
                  onClick={() => { setIsRegister(true); setError(''); }}
                  className="text-brand-primary font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Register Account
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
