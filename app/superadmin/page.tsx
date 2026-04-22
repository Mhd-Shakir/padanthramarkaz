'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toaster';
import { QrModal, ReceiptPoster, QrTarget } from '@/components/ui/PaymentComponents';

interface Admin {
  _id: string;
  name: string;
  place: string;
  phone: string;
  accessCode: string;
  isActive: boolean;
  userCount: number;
  totalAmount: number;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  place: string;
  contact: string;
  amount: number;
  createdAt: string;
  createdBy: { name: string; place: string };
  transactionStatus?: 'pending' | 'submitted' | 'verified' | 'rejected';
  receiptNumber?: string;
  verifiedAt?: string;
  shortCode?: string;
}

type ActiveView = 'admins' | 'users';

export default function SuperAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('admins');

  // Admins state
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminPagination, setAdminPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // CRUD state
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', place: '', phone: '' });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', place: '', contact: '', amount: '', adminId: '' });

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [userPagination, setUserPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [usersLoading, setUsersLoading] = useState(true);

  // Summary
  const [summary, setSummary] = useState({ totalAdmins: 0, totalUsers: 0, totalAmount: 0, activeAdmins: 0 });

  // Verification & Payment states
  const [qrTarget, setQrTarget] = useState<QrTarget | null>(null);
  const [posterData, setPosterData] = useState<any | null>(null);
  const [instantLoading, setInstantLoading] = useState<string | null>(null);

  // Verify super admin
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) return router.replace('/auth');
        if (!data.isSuperAdmin) return router.replace('/dashboard');
      })
      .catch(() => router.replace('/auth'))
      .finally(() => setLoading(false));
  }, [router]);

  const fetchAdmins = useCallback(async (page = 1, search = '') => {
    setAdminsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15', search });
      const res = await fetch(`/api/admins?${params}`);
      const data = await res.json();
      setAdmins(data.admins || []);
      setAdminPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      toast('Failed to load admins', 'error');
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (page = 1) => {
    setUsersLoading(true);
    try {
      const res = await fetch(`/api/users?page=${page}&limit=15`);
      const data = await res.json();
      setUsers(data.users || []);
      setUserPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setSummary({
        totalAdmins: data.totalAdmins || 0,
        totalUsers: data.totalUsers || 0,
        totalAmount: data.totalAmount || 0,
        activeAdmins: data.activeAdmins || 0,
      });
    } catch {}
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchAdmins();
      fetchUsers();
      fetchSummary();
    }
  }, [loading, fetchAdmins, fetchUsers, fetchSummary]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdmins(1, adminSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [adminSearch, fetchAdmins]);

  async function toggleAdmin(adminId: string, isActive: boolean) {
    setTogglingId(adminId);
    try {
      const res = await fetch('/api/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, isActive }),
      });
      if (!res.ok) throw new Error('Failed');
      setAdmins((prev) =>
        prev.map((a) => (a._id === adminId ? { ...a, isActive } : a))
      );
      toast(`Admin ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch {
      toast('Failed to update admin status', 'error');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!newAdminForm.name.trim() || !newAdminForm.place.trim() || !newAdminForm.phone.trim()) return;
    setProcessingId('new_admin');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdminForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast('Admin created successfully', 'success');
      setIsAddingAdmin(false);
      setNewAdminForm({ name: '', place: '', phone: '' });
      fetchAdmins(1, adminSearch);
      fetchSummary();
    } catch {
      toast('Failed to create admin', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  async function deleteAdmin(id: string) {
    if (!confirm('Are you sure you want to delete this admin? This cannot be undone.')) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admins/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast('Admin deleted successfully', 'success');
      fetchAdmins(adminPagination.page, adminSearch);
      fetchSummary();
    } catch {
      toast('Failed to delete admin', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.place.trim() || !newUserForm.contact.trim() || !newUserForm.adminId) {
      toast('Please fill all fields and select an admin.', 'error');
      return;
    }
    setProcessingId('new_user');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUserForm, amount: Number(newUserForm.amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast('User added successfully', 'success');
      setIsAddingUser(false);
      setNewUserForm({ name: '', place: '', contact: '', amount: '', adminId: '' });
      fetchUsers(1);
      fetchSummary();
    } catch (err: any) {
      toast(err.message || 'Failed to create user', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  async function updateAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAdmin) return;
    setProcessingId(editingAdmin._id);
    try {
      const res = await fetch(`/api/admins/${editingAdmin._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingAdmin.name, place: editingAdmin.place, phone: editingAdmin.phone }),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Admin updated successfully', 'success');
      setEditingAdmin(null);
      fetchAdmins(adminPagination.page, adminSearch);
    } catch {
      toast('Failed to update admin', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast('User deleted successfully', 'success');
      fetchUsers(userPagination.page);
      fetchSummary();
    } catch {
      toast('Failed to delete user', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  async function updateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setProcessingId(editingUser._id);
    try {
      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingUser.name, place: editingUser.place, contact: editingUser.contact, amount: editingUser.amount }),
      });
      if (!res.ok) throw new Error('Failed');
      toast('User updated successfully', 'success');
      setEditingUser(null);
      fetchUsers(userPagination.page);
      fetchSummary();
    } catch {
      toast('Failed to update user', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  }

  async function handleInstantVerify(user: User) {
    setInstantLoading(user._id);
    try {
      const res = await fetch('/api/admin/transactions/instant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user._id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast('Payment recorded and verified!', 'success');
        setPosterData({
          receiptNumber: data.transaction.receiptNumber,
          userName: user.name,
          place: user.place,
          amount: data.transaction.amount || user.amount,
          date: data.transaction.verifiedAt || new Date().toISOString()
        });
        setUsers(prev => prev.map(u => 
          u._id === user._id 
            ? { ...u, transactionStatus: 'verified', receiptNumber: data.transaction.receiptNumber, verifiedAt: data.transaction.verifiedAt } 
            : u
        ));
      } else {
        toast(data.error || 'Failed to verify payment', 'error');
      }
    } catch {
      toast('Error verifying payment', 'error');
    } finally {
      setInstantLoading(null);
    }
  }

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-black text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-black font-black text-sm">PM</span>
            </div>
            <div>
              <p className="font-bold text-sm leading-none">Super Admin</p>
              <p className="text-[11px] text-neutral-400 leading-none mt-0.5">Global Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-xs text-neutral-400 hover:text-white transition-colors">
              ← Leaderboard
            </a>
            <button
              onClick={handleLogout}
              className="text-xs border border-white/20 rounded px-3 py-1.5 hover:bg-white/10 transition-colors font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Total Admins', value: summary.totalAdmins },
            { label: 'Active Admins', value: summary.activeAdmins },
            { label: 'Total Users', value: summary.totalUsers },
            { label: 'Total Amount', value: formatAmount(summary.totalAmount) },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-xl px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
              <p className="text-xl sm:text-2xl font-black tracking-tight">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-neutral-500 font-medium mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-white border border-neutral-200 rounded-xl p-1 mb-5 sm:mb-6 w-full sm:w-fit shadow-sm overflow-x-auto">
          {(['admins', 'users'] as ActiveView[]).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeView === view
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              {view === 'admins'
                ? `Admins (${adminPagination.total})`
                : `All Users (${userPagination.total})`}
            </button>
          ))}
        </div>

        {/* Admins Table */}
        {activeView === 'admins' && (
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="font-black text-base">All Admins</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, place, phone..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="text-sm border border-neutral-200 rounded px-3 py-1.5 pl-7 focus:outline-none focus:border-black transition-all w-full sm:w-64"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">⌕</span>
                </div>
                <button
                  onClick={() => setIsAddingAdmin(true)}
                  className="text-xs bg-black text-white rounded px-3 py-1.5 hover:bg-neutral-800 transition-colors font-medium"
                >
                  + Add Admin
                </button>
                <button
                  onClick={() => fetchAdmins(adminPagination.page, adminSearch)}
                  className="text-xs border border-neutral-200 rounded px-3 py-1.5 hover:bg-neutral-50 transition-colors font-medium"
                >
                  ↻
                </button>
              </div>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden divide-y divide-neutral-100">
              {adminsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 space-y-3">
                    <div className="flex justify-between"><div className="h-4 skeleton rounded w-32" /><div className="h-4 skeleton rounded w-16" /></div>
                    <div className="flex justify-between"><div className="h-4 skeleton rounded w-24" /><div className="h-6 skeleton rounded w-16" /></div>
                  </div>
                ))
              ) : admins.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 text-sm">
                  {adminSearch ? `No admins match "${adminSearch}"` : 'No admins found'}
                </div>
              ) : (
                admins.map((admin) => (
                  <div key={admin._id} className="px-5 py-4 flex flex-col gap-3 hover:bg-neutral-50/80 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-black">{admin.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{admin.place} · {admin.phone}</p>
                      </div>
                      <p className="font-bold text-sm text-black">{formatAmount(admin.totalAmount)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${admin.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-[11px] font-semibold bg-neutral-100 px-2 py-0.5 rounded-full text-neutral-600">
                          {admin.userCount} Users
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingAdmin(admin)}
                          className="text-[11px] font-semibold px-2 py-1 rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAdmin(admin._id)}
                          disabled={processingId === admin._id}
                          className="text-[11px] font-semibold px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => toggleAdmin(admin._id, !admin.isActive)}
                          disabled={togglingId === admin._id}
                          className={`text-[11px] font-semibold px-2 py-1 rounded border transition-colors disabled:opacity-50 ${admin.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}
                        >
                          {togglingId === admin._id ? '...' : admin.isActive ? 'Deact' : 'Act'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    {['Name', 'Place', 'Phone', 'Users', 'Amount', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adminsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-neutral-50">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 skeleton rounded" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-neutral-400 text-sm">
                        {adminSearch ? `No admins match "${adminSearch}"` : 'No admins found'}
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin._id} className="border-b border-neutral-50 hover:bg-neutral-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-black whitespace-nowrap">{admin.name}</td>
                        <td className="px-4 py-3 text-neutral-600">{admin.place}</td>
                        <td className="px-4 py-3 text-neutral-600 font-mono text-xs">{admin.phone}</td>
                        <td className="px-4 py-3 font-bold">{admin.userCount}</td>
                        <td className="px-4 py-3 text-neutral-700 font-medium whitespace-nowrap">{formatAmount(admin.totalAmount)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              admin.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleAdmin(admin._id, !admin.isActive)}
                              disabled={togglingId === admin._id}
                              className={`text-[11px] font-semibold px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
                                admin.isActive
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-green-200 text-green-700 hover:bg-green-50'
                              }`}
                            >
                              {togglingId === admin._id ? '...' : admin.isActive ? 'Deact' : 'Act'}
                            </button>
                            <button
                              onClick={() => setEditingAdmin(admin)}
                              className="text-[11px] font-semibold px-2 py-1 rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteAdmin(admin._id)}
                              disabled={processingId === admin._id}
                              className="text-[11px] font-semibold px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {adminPagination.pages > 1 && (
              <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  Page {adminPagination.page} of {adminPagination.pages} ({adminPagination.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={adminPagination.page <= 1}
                    onClick={() => fetchAdmins(adminPagination.page - 1, adminSearch)}
                    className="text-xs border border-neutral-200 rounded px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                  >← Prev</button>
                  <button
                    disabled={adminPagination.page >= adminPagination.pages}
                    onClick={() => fetchAdmins(adminPagination.page + 1, adminSearch)}
                    className="text-xs border border-neutral-200 rounded px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                  >Next →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Users Table */}
        {activeView === 'users' && (
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="font-black text-base">All Users (Global)</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddingUser(true)}
                  className="text-xs bg-black text-white rounded px-3 py-1.5 hover:bg-neutral-800 transition-colors font-medium"
                >
                  + Add User
                </button>
                <button
                  onClick={() => fetchUsers(userPagination.page)}
                  className="text-xs border border-neutral-200 rounded px-3 py-1.5 hover:bg-neutral-50 transition-colors font-medium"
                >↻ Refresh</button>
              </div>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden divide-y divide-neutral-100">
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 space-y-2">
                    <div className="flex justify-between"><div className="h-4 skeleton rounded w-32" /><div className="h-4 skeleton rounded w-16" /></div>
                    <div className="flex justify-between"><div className="h-4 skeleton rounded w-24" /><div className="h-4 skeleton rounded w-24" /></div>
                  </div>
                ))
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 text-sm">No users found</div>
              ) : (
                users.map((user) => (
                  <div key={user._id} className="px-5 py-4 flex flex-col gap-2 hover:bg-neutral-50/80 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-black">{user.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{user.place}</p>
                      </div>
                      <p className="font-bold text-sm text-black">{formatAmount(user.amount)}</p>
                    </div>
                      {/* Mobile View user info */}
                      <div className="flex justify-between items-center bg-neutral-50/50 p-2 rounded border border-neutral-100">
                        <div className="flex flex-col gap-1">
                          <a href={`tel:${user.contact}`} className="font-mono text-xs text-black underline underline-offset-2 decoration-neutral-300 hover:decoration-black active:text-neutral-600 transition-colors">
                            {user.contact}
                          </a>
                          <p className="text-[10px] text-neutral-400">
                            Added by <span className="font-semibold text-black">{user.createdBy?.name || '—'}</span> · {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center flex-wrap justify-end">
                          <button
                            onClick={() => setQrTarget({ userId: user._id, name: user.name, amount: user.amount, contact: user.contact, shortCode: user.shortCode })}
                            className="flex items-center justify-center h-7 px-2 text-[10px] bg-white font-semibold rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors shadow-sm"
                            title="QR Pay"
                          >
                            QR
                          </button>
                          <label className="flex items-center justify-center w-7 h-7 bg-white rounded border border-neutral-200 shadow-sm cursor-pointer" title={user.transactionStatus === 'verified' ? "Payment Verified" : "Verify & Create Poster"}>
                            <input
                              type="checkbox"
                              checked={user.transactionStatus === 'verified'}
                              disabled={instantLoading === user._id || user.transactionStatus === 'verified'}
                              onChange={(e) => {
                                if (e.target.checked && user.transactionStatus !== 'verified') {
                                  handleInstantVerify(user);
                                }
                              }}
                              className="w-4 h-4 rounded border-neutral-300 accent-black"
                            />
                          </label>
                          {user.transactionStatus === 'verified' && (
                            <button
                              onClick={() => setPosterData({
                                receiptNumber: user.receiptNumber || 'PENDING',
                                userName: user.name,
                                place: user.place,
                                amount: user.amount,
                                date: user.verifiedAt || user.createdAt
                              })}
                              className="flex items-center justify-center h-7 px-2 text-[10px] bg-black text-white font-semibold rounded shadow-sm hover:bg-neutral-800 transition-colors"
                            >
                              POSTER
                            </button>
                          )}
                          <button
                            onClick={() => setEditingUser(user)}
                            className="flex items-center justify-center w-7 h-7 text-[10px] bg-white font-semibold rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors shadow-sm"
                            title="Edit User"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => deleteUser(user._id)}
                            disabled={processingId === user._id}
                            className="flex items-center justify-center w-7 h-7 text-[10px] bg-white font-semibold rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 shadow-sm"
                            title="Delete User"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                ))
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    {['Name', 'Place', 'Contact', 'Amount', 'Added By', 'Date', 'Payment', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-neutral-50">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 skeleton rounded" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-neutral-400 text-sm">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="border-b border-neutral-50 hover:bg-neutral-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold">{user.name}</td>
                        <td className="px-4 py-3 text-neutral-600">{user.place}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`tel:${user.contact}`}
                            className="font-mono text-xs text-black underline underline-offset-2 decoration-neutral-300 hover:decoration-black active:text-neutral-600 transition-colors"
                          >
                            {user.contact}
                          </a>
                        </td>
                        <td className="px-4 py-3 font-bold">{formatAmount(user.amount)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded font-medium text-neutral-700">
                            {user.createdBy?.name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setQrTarget({ userId: user._id, name: user.name, amount: user.amount, contact: user.contact, shortCode: user.shortCode })}
                              className="p-1.5 hover:bg-neutral-100 rounded transition-colors group"
                              title="QR Pay"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400 group-hover:text-black">
                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                <path d="M14 14h2v2h-2z" /><path d="M18 14h3v3h-3z" /><path d="M14 18h3v3h-3z" /><path d="M20 20h1v1h-1z" />
                              </svg>
                            </button>
                            
                            <label className="flex items-center gap-1.5 cursor-pointer" title={user.transactionStatus === 'verified' ? "Payment Verified" : "Verify & Create Poster"}>
                              <input
                                type="checkbox"
                                checked={user.transactionStatus === 'verified'}
                                disabled={instantLoading === user._id || user.transactionStatus === 'verified'}
                                onChange={(e) => {
                                  if (e.target.checked && user.transactionStatus !== 'verified') {
                                    handleInstantVerify(user);
                                  }
                                }}
                                className={`w-4 h-4 rounded border-neutral-300 accent-black transition-all ${user.transactionStatus === 'verified' ? 'opacity-100' : ''}`}
                              />
                              <span className={`text-[10px] font-bold ${user.transactionStatus === 'verified' ? 'text-green-600' : 'text-neutral-400'}`}>
                                {instantLoading === user._id ? '...' : user.transactionStatus === 'verified' ? 'VERIFIED' : ''}
                              </span>
                            </label>
                            
                            {user.transactionStatus === 'verified' && (
                              <button
                                onClick={() => setPosterData({
                                  receiptNumber: user.receiptNumber || 'PENDING',
                                  userName: user.name,
                                  place: user.place,
                                  amount: user.amount,
                                  date: user.verifiedAt || user.createdAt
                                })}
                                className="p-1 px-2 bg-neutral-100 hover:bg-neutral-200 rounded text-[9px] font-bold text-neutral-600 transition-colors"
                              >
                                VIEW POSTER
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-[11px] font-semibold px-2 py-1 rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteUser(user._id)}
                              disabled={processingId === user._id}
                              className="text-[11px] font-semibold px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {userPagination.pages > 1 && (
              <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  Page {userPagination.page} of {userPagination.pages} ({userPagination.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={userPagination.page <= 1}
                    onClick={() => fetchUsers(userPagination.page - 1)}
                    className="text-xs border border-neutral-200 rounded px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                  >← Prev</button>
                  <button
                    disabled={userPagination.page >= userPagination.pages}
                    onClick={() => fetchUsers(userPagination.page + 1)}
                    className="text-xs border border-neutral-200 rounded px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                  >Next →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Admin Modal */}
      {isAddingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="font-bold">Add New Admin</h3>
              <button onClick={() => setIsAddingAdmin(false)} className="text-neutral-400 hover:text-black font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Name</label>
                <input type="text" placeholder="e.g. Abdul Rahman" value={newAdminForm.name} onChange={(e) => setNewAdminForm({...newAdminForm, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Place</label>
                <input type="text" placeholder="e.g. Padanthara" value={newAdminForm.place} onChange={(e) => setNewAdminForm({...newAdminForm, place: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Phone</label>
                <input type="tel" placeholder="e.g. 9876543210" value={newAdminForm.phone} onChange={(e) => setNewAdminForm({...newAdminForm, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddingAdmin(false)} className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-neutral-50 transition-colors">Cancel</button>
                <button type="submit" disabled={processingId === 'new_admin'} className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex gap-2 items-center">
                  {processingId === 'new_admin' && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editing Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="font-bold">Edit Admin</h3>
              <button onClick={() => setEditingAdmin(null)} className="text-neutral-400 hover:text-black font-bold">✕</button>
            </div>
            <form onSubmit={updateAdmin} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Name</label>
                <input type="text" value={editingAdmin.name} onChange={(e) => setEditingAdmin({...editingAdmin, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Place</label>
                <input type="text" value={editingAdmin.place} onChange={(e) => setEditingAdmin({...editingAdmin, place: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Phone</label>
                <input type="tel" value={editingAdmin.phone} onChange={(e) => setEditingAdmin({...editingAdmin, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingAdmin(null)} className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-neutral-50 transition-colors">Cancel</button>
                <button type="submit" disabled={processingId === editingAdmin._id} className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex gap-2 items-center">
                  {processingId === editingAdmin._id && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editing User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="font-bold">Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="text-neutral-400 hover:text-black font-bold">✕</button>
            </div>
            <form onSubmit={updateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Name</label>
                <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Place</label>
                <input type="text" value={editingUser.place} onChange={(e) => setEditingUser({...editingUser, place: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Contact</label>
                <input type="tel" value={editingUser.contact} onChange={(e) => setEditingUser({...editingUser, contact: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Amount (₹)</label>
                <input type="number" value={editingUser.amount} onChange={(e) => setEditingUser({...editingUser, amount: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-neutral-50 transition-colors">Cancel</button>
                <button type="submit" disabled={processingId === editingUser._id} className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex gap-2 items-center">
                  {processingId === editingUser._id && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="font-bold">Add New User</h3>
              <button onClick={() => setIsAddingUser(false)} className="text-neutral-400 hover:text-black font-bold">✕</button>
            </div>
            <div className="overflow-y-auto p-5">
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Assign to Admin</label>
                  <select 
                    value={newUserForm.adminId} 
                    onChange={(e) => setNewUserForm({...newUserForm, adminId: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
                    required
                  >
                    <option value="">Select an Admin...</option>
                    {admins.map(admin => (
                      <option key={admin._id} value={admin._id}>{admin.name} ({admin.place})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">User Name</label>
                  <input type="text" placeholder="e.g. Ahmad" value={newUserForm.name} onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Place</label>
                  <input type="text" placeholder="e.g. Calicut" value={newUserForm.place} onChange={(e) => setNewUserForm({...newUserForm, place: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Contact</label>
                  <input type="tel" placeholder="e.g. 9876543210" value={newUserForm.contact} onChange={(e) => setNewUserForm({...newUserForm, contact: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Amount (₹)</label>
                  <input type="number" placeholder="0" value={newUserForm.amount} onChange={(e) => setNewUserForm({...newUserForm, amount: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" required />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-neutral-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={processingId === 'new_user'} className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex gap-2 items-center">
                    {processingId === 'new_user' && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {qrTarget && (
        <QrModal target={qrTarget} onClose={() => setQrTarget(null)} />
      )}
      {posterData && (
        <ReceiptPoster data={posterData} onClose={() => setPosterData(null)} />
      )}
    </div>
  );
}
