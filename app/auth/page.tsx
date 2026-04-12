'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/components/ui/Toaster';

type Tab = 'login' | 'register';

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('login');
  const router = useRouter();

  // Login state — name + phone
  const [loginForm, setLoginForm] = useState({ name: '', phone: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regForm, setRegForm] = useState({ name: '', place: '', phone: '' });
  const [regLoading, setRegLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginForm.name.trim() || !loginForm.phone.trim()) {
      toast('Name and phone are required', 'error');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: loginForm.name.trim(), phone: loginForm.phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Login failed', 'error');
        return;
      }
      toast(`Welcome, ${data.name}!`, 'success');
      if (data.isSuperAdmin) {
        router.push('/superadmin');
      } else {
        router.push('/dashboard');
      }
    } catch {
      toast('Network error. Please try again.', 'error');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regForm.name.trim() || !regForm.place.trim() || !regForm.phone.trim()) {
      toast('All fields are required', 'error');
      return;
    }
    setRegLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Registration failed', 'error');
        return;
      }
      toast('Registered successfully! You can now sign in.', 'success');
      setRegistered(true);
      // Pre-fill login form and switch to login tab
      setLoginForm({ name: regForm.name, phone: regForm.phone });
      setRegForm({ name: '', place: '', phone: '' });
    } catch {
      toast('Network error. Please try again.', 'error');
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dot-grid flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="font-bold text-sm group-hover:text-neutral-600 transition-colors">
              Padanthara Markaz
            </span>
          </Link>
          <Link href="/" className="text-xs sm:text-sm text-neutral-500 hover:text-black transition-colors">
            ← Leaderboard
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-14">
        <div className="w-full max-w-md animate-fade-up">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b border-neutral-200">
              {(['login', 'register'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setRegistered(false);
                  }}
                  className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors ${
                    tab === t
                      ? 'bg-black text-white'
                      : 'bg-white text-neutral-500 hover:text-black hover:bg-neutral-50'
                  }`}
                >
                  {t === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-8">
              {/* ── SIGN IN TAB ── */}
              {tab === 'login' ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">Welcome back</h2>
                    <p className="text-sm text-neutral-500 mt-1">Sign in with your name and phone number.</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={loginForm.name}
                        onChange={(e) => setLoginForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Abdul Rahman"
                        className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-neutral-300"
                        autoComplete="name"
                        autoFocus
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={loginForm.phone}
                        onChange={(e) => setLoginForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="e.g. 9876543210"
                        className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-neutral-300"
                        autoComplete="tel"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading || !loginForm.name.trim() || !loginForm.phone.trim()}
                      className="w-full bg-black text-white py-3 rounded-lg font-semibold text-sm hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      {loginLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In →'
                      )}
                    </button>
                  </form>

                  <p className="text-xs text-neutral-400 text-center mt-5">
                    New admin?{' '}
                    <button
                      onClick={() => setTab('register')}
                      className="text-black font-semibold hover:underline"
                    >
                      Register here
                    </button>
                  </p>
                </>
              ) : (
                /* ── REGISTER TAB ── */
                <>
                  {registered ? (
                    <div className="text-center animate-fade-up py-4">
                      <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-2xl">✓</span>
                      </div>
                      <h2 className="text-xl font-black tracking-tight mb-2">Registered!</h2>
                      <p className="text-sm text-neutral-500 mb-6">
                        Your account is ready. Sign in with your name and phone number.
                      </p>
                      <button
                        onClick={() => {
                          setTab('login');
                          setRegistered(false);
                        }}
                        className="w-full bg-black text-white py-3 rounded-lg font-semibold text-sm hover:bg-neutral-800 transition-colors"
                      >
                        Go to Sign In →
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Create account</h2>
                        <p className="text-sm text-neutral-500 mt-1">
                          Register to access your admin dashboard.
                        </p>
                      </div>

                      <form onSubmit={handleRegister} className="space-y-4">
                        {[
                          { field: 'name', label: 'Full Name', placeholder: 'e.g. Abdul Rahman', type: 'text' },
                          { field: 'place', label: 'Place', placeholder: 'e.g. Padanthara', type: 'text' },
                          { field: 'phone', label: 'Phone Number', placeholder: 'e.g. 9876543210', type: 'tel' },
                        ].map(({ field, label, placeholder, type }) => (
                          <div key={field}>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                              {label}
                            </label>
                            <input
                              type={type}
                              value={regForm[field as keyof typeof regForm]}
                              onChange={(e) =>
                                setRegForm((prev) => ({ ...prev, [field]: e.target.value }))
                              }
                              placeholder={placeholder}
                              className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-neutral-300"
                              required
                            />
                          </div>
                        ))}

                        <button
                          type="submit"
                          disabled={regLoading}
                          className="w-full bg-black text-white py-3 rounded-lg font-semibold text-sm hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
                        >
                          {regLoading ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Registering...
                            </>
                          ) : (
                            'Register'
                          )}
                        </button>
                      </form>

                      <p className="text-xs text-neutral-400 text-center mt-5">
                        Already registered?{' '}
                        <button
                          onClick={() => setTab('login')}
                          className="text-black font-semibold hover:underline"
                        >
                          Sign in
                        </button>
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
