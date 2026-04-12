'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toaster';

interface SessionData {
  name: string;
  adminId: string;
}

interface User {
  _id: string;
  name: string;
  place: string;
  contact: string;
  amount: number;
  createdAt: string;
}

const initialForm = { name: '', place: '', contact: '', amount: '' };

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  // Verify session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          router.replace('/auth');
        } else if (data.isSuperAdmin) {
          router.replace('/superadmin');
        } else {
          setSession({ name: data.name, adminId: data.adminId });
        }
      })
      .catch(() => router.replace('/auth'))
      .finally(() => setLoading(false));
  }, [router]);

  const fetchUsers = useCallback(async (page = 1) => {
    setUsersLoading(true);
    try {
      const res = await fetch(`/api/users?page=${page}&limit=10`);
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchUsers();
  }, [session, fetchUsers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.place || !form.contact || !form.amount) {
      toast('All fields are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to add user', 'error');
        return;
      }
      toast('User added successfully!', 'success');
      setForm(initialForm);
      fetchUsers(1);
    } catch {
      toast('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  }

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navbar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <div>
              <p className="font-bold text-sm leading-none">Admin Dashboard</p>
              <p className="text-[11px] text-neutral-500 leading-none mt-0.5">
                Signed in as <span className="font-semibold text-black">{session.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-neutral-500 hover:text-black transition-colors border border-neutral-200 rounded px-3 py-1.5 hover:border-black font-medium"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-8">
        {/* Add User Form */}
        <div className="lg:col-span-2 order-1 lg:order-none">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden lg:sticky lg:top-24">
            <div className="px-6 py-5 border-b border-neutral-100">
              <h2 className="font-black text-lg tracking-tight">Add New User</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Fill in the details to add a user.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[
                { field: 'name', label: 'Full Name', placeholder: 'User\'s full name', type: 'text' },
                { field: 'place', label: 'Place', placeholder: 'City or village', type: 'text' },
                { field: 'contact', label: 'Contact', placeholder: 'Phone number', type: 'tel' },
                { field: 'amount', label: 'Amount (₹)', placeholder: '0', type: 'number' },
              ].map(({ field, label, placeholder, type }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[field as keyof typeof form]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [field]: e.target.value }))
                    }
                    placeholder={placeholder}
                    min={type === 'number' ? '0' : undefined}
                    className="w-full border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-neutral-300"
                    required
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold text-sm hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  '+ Add User'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="font-black text-lg tracking-tight">My Users</h2>
                <p className="text-xs text-neutral-500 mt-0.5">{pagination.total} total entries</p>
              </div>
              <button
                onClick={() => fetchUsers(pagination.page)}
                className="text-xs border border-neutral-200 rounded px-3 py-1.5 hover:bg-neutral-50 transition-colors font-medium"
              >
                ↻ Refresh
              </button>
            </div>

            {usersLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 skeleton rounded-lg" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center text-neutral-400">
                <div className="w-12 h-12 border-2 border-dashed border-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl text-neutral-300">+</span>
                </div>
                <p className="text-sm font-medium">No users added yet</p>
                <p className="text-xs mt-1">Use the form to add your first user.</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-neutral-50">
                  {users.map((user) => (
                    <div key={user._id} className="px-6 py-4 flex items-start justify-between gap-3 hover:bg-neutral-50/60 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[10px] font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-black leading-none">{user.name}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {user.place} ·{' '}
                              <a
                                href={`tel:${user.contact}`}
                                className="font-mono text-black underline underline-offset-2 decoration-neutral-300 hover:decoration-black active:text-neutral-600 transition-colors"
                              >
                                {user.contact}
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm">{formatAmount(user.amount)}</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between">
                    <p className="text-xs text-neutral-500">
                      Page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        disabled={pagination.page <= 1}
                        onClick={() => fetchUsers(pagination.page - 1)}
                        className="text-xs border border-neutral-200 rounded px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        ← Prev
                      </button>
                      <button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => fetchUsers(pagination.page + 1)}
                        className="text-xs border border-neutral-200 rounded px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
