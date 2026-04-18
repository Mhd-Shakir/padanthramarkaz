'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toaster';
import QRCode from 'qrcode';

const UPI_ID = 'qr.markaz1@sib';
const PAYEE_NAME = 'Padanthara Markaz';

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
  shortCode?: string;
  createdAt: string;
}

interface QrTarget {
  userId: string;
  name: string;
  amount: number;
  shortCode?: string;
}

const initialForm = { name: '', place: '', contact: '', amount: '' };

function buildUpiUri(amount: number) {
  return `upi://pay?${new URLSearchParams({
    pa: UPI_ID,
    pn: PAYEE_NAME,
    am: amount.toString(),
    cu: 'INR',
    tn: 'Padanthara Markaz Donation',
  }).toString()}`;
}

// ── QR Modal ─────────────────────────────────────────────────────────────────
function QrModal({ target, onClose }: { target: QrTarget; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  // Local shortCode — may be fetched lazily for old users
  const [resolvedCode, setResolvedCode] = useState<string | undefined>(target.shortCode);

  // If the user has no shortCode yet, generate one silently
  useEffect(() => {
    if (!target.shortCode) {
      fetch(`/api/users/${target.userId}/shortcode`, { method: 'PATCH' })
        .then((r) => r.json())
        .then((data) => { if (data.shortCode) setResolvedCode(data.shortCode); })
        .catch(() => { /* fallback to full URL */ });
    } else {
      setResolvedCode(target.shortCode);
    }
  }, [target.userId, target.shortCode]);

  // Build the shareable pay page URL — short if available, full fallback
  const payLink = typeof window !== 'undefined'
    ? resolvedCode
      ? `${window.location.origin}/p/${resolvedCode}`
      : `${window.location.origin}/pay/${target.userId}`
    : resolvedCode
      ? `/p/${resolvedCode}`
      : `/pay/${target.userId}`;

  useEffect(() => {
    QRCode.toDataURL(buildUpiUri(target.amount), {
      width: 200,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(setQrDataUrl);
  }, [target]);

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  async function handleCopy() {
    await navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(payLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  function handleWhatsApp() {
    const msg = `സലാം 👋\n\n*Padanthara Markaz* — Payment Request\n\nDear *${target.name}*,\n\nYour payment of *${formatAmount(target.amount)}* is due.\n\nPlease scan the QR code or click the link below to pay via Google Pay, PhonePe, Paytm or any UPI app:\n\n👉 ${payLink}\n\nJazakallahu Khairan 🤲`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Sheet */}
      <div
        style={{
          background: 'linear-gradient(160deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)',
          borderRadius: '28px 28px 0 0',
          width: '100%',
          maxWidth: '360px',
          padding: '0 0 32px',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow blobs */}
        <div style={{ position:'absolute', top:'-60px', left:'-60px', width:'200px', height:'200px', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', filter:'blur(30px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-40px', right:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', filter:'blur(25px)', pointerEvents:'none' }} />

        {/* Drag handle */}
        <div style={{ display:'flex', justifyContent:'center', paddingTop:'12px', paddingBottom:'4px' }}>
          <div style={{ width:'40px', height:'4px', borderRadius:'2px', background:'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position:'absolute', top:'12px', right:'16px',
            width:'32px', height:'32px', borderRadius:'50%',
            background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)',
            color:'rgba(255,255,255,0.6)', fontSize:'16px', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            lineHeight:1,
          }}
          aria-label="Close"
        >
          ×
        </button>

        <div style={{ padding:'12px 24px 0', position:'relative' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
            <div style={{
              width:'38px', height:'38px', borderRadius:'12px',
              background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'17px', color:'#fff', fontWeight:800,
              boxShadow:'0 4px 12px rgba(99,102,241,0.4)', flexShrink:0,
            }}>₹</div>
            <div>
              <p style={{ fontSize:'15px', fontWeight:800, color:'#fff', lineHeight:1 }}>Padanthara Markaz</p>
              <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.45)', marginTop:'3px' }}>Secure UPI Payment</p>
            </div>
          </div>

          {/* App badges */}
          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'14px' }}>
            {['Google Pay','PhonePe','Paytm','BHIM','Amazon Pay'].map((a) => (
              <span key={a} style={{
                fontSize:'8px', fontWeight:600, padding:'2px 7px', borderRadius:'20px',
                background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.5)',
                border:'1px solid rgba(255,255,255,0.1)', letterSpacing:'0.2px',
              }}>{a}</span>
            ))}
          </div>

          {/* Recipient */}
          <div style={{
            display:'flex', alignItems:'center', gap:'10px',
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'14px', padding:'10px 12px', marginBottom:'14px',
          }}>
            <div style={{
              width:'36px', height:'36px', borderRadius:'50%',
              background:'linear-gradient(135deg,#10b981,#059669)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'16px', fontWeight:800, color:'#fff', flexShrink:0,
              boxShadow:'0 4px 10px rgba(16,185,129,0.3)',
            }}>{target.name.charAt(0).toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', fontWeight:500, marginBottom:'2px' }}>Pay amount collected by</p>
              <p style={{ fontSize:'13px', fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{target.name}</p>
            </div>
            <div style={{
              background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)',
              borderRadius:'20px', padding:'3px 8px', fontSize:'9px', color:'#10b981', fontWeight:600,
            }}>✓ UPI</div>
          </div>

          {/* Amount */}
          <div style={{ textAlign:'center', marginBottom:'16px' }}>
            <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:600, marginBottom:'4px' }}>Amount to Pay</p>
            <p style={{
              fontSize:'32px', fontWeight:900, letterSpacing:'-1.5px', lineHeight:1,
              background:'linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.65))',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}>{formatAmount(target.amount)}</p>
            <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', marginTop:'5px' }}>Fixed amount · auto-filled in QR</p>
          </div>

          {/* QR Code */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'16px' }}>
            <div style={{
              position:'relative', padding:'10px',
              background:'#fff', borderRadius:'18px',
              boxShadow:'0 8px 28px rgba(0,0,0,0.35)',
              marginBottom:'10px',
            }}>
              {/* Corner decorators */}
              {[
                { top:0, left:0, borderTopWidth:3, borderLeftWidth:3 },
                { top:0, right:0, borderTopWidth:3, borderRightWidth:3 },
                { bottom:0, left:0, borderBottomWidth:3, borderLeftWidth:3 },
                { bottom:0, right:0, borderBottomWidth:3, borderRightWidth:3 },
              ].map((s, i) => (
                <div key={i} style={{
                  position:'absolute', width:'16px', height:'16px',
                  borderColor:'#6366f1', borderStyle:'solid', borderWidth:0,
                  borderRadius:'3px', ...s,
                }} />
              ))}

              {qrDataUrl ? (
                <div style={{ position:'relative', overflow:'hidden', borderRadius:'6px' }}>
                  <div style={{
                    position:'absolute', left:0, right:0, height:'2px',
                    background:'linear-gradient(90deg,transparent,#6366f1,#8b5cf6,#6366f1,transparent)',
                    boxShadow:'0 0 10px 2px rgba(99,102,241,0.5)',
                    zIndex:10, borderRadius:'2px',
                    animation:'scanLine 2.5s ease-in-out infinite',
                  }} />
                  <img src={qrDataUrl} alt="UPI QR" style={{ display:'block', width:'180px', height:'180px', borderRadius:'4px' }} />
                </div>
              ) : (
                <div style={{
                  width:'180px', height:'180px',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <div style={{
                    width:'32px', height:'32px',
                    border:'3px solid rgba(0,0,0,0.1)', borderTopColor:'#6366f1',
                    borderRadius:'50%', animation:'spin 0.8s linear infinite',
                  }} />
                </div>
              )}
            </div>
            <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)', textAlign:'center', lineHeight:1.5, fontWeight:500 }}>
              📱 Open any UPI app → Scan QR → Pay <strong style={{ color:'#fff' }}>{formatAmount(target.amount)}</strong>
            </p>
          </div>

          {/* UPI ID row */}
          <div style={{
            display:'flex', alignItems:'center', gap:'8px',
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'12px', padding:'9px 12px', marginBottom:'14px',
          }}>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:'8px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600, marginBottom:'2px' }}>UPI ID</p>
              <p style={{ fontSize:'12px', fontWeight:700, color:'#a5b4fc', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{UPI_ID}</p>
            </div>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(99,102,241,0.3)',
                color: copied ? '#10b981' : '#a5b4fc',
                borderRadius:'8px', padding:'5px 12px',
                fontSize:'11px', fontWeight:600, cursor:'pointer',
                transition:'all 0.2s', flexShrink:0,
              }}
            >{copied ? '✓ Copied' : 'Copy'}</button>
          </div>

          {/* ── Share Payment Link ── */}
          <div style={{ marginBottom:'12px' }}>
            <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600, marginBottom:'7px' }}>
              📤 Share Payment Link
            </p>

            {/* Link display + copy */}
            <div style={{
              display:'flex', alignItems:'center', gap:'6px',
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:'12px', padding:'8px 12px', marginBottom:'8px',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <p style={{
                flex:1, fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.7)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'monospace',
              }}>{payLink}</p>
              <button
                onClick={handleCopyLink}
                style={{
                  background: copiedLink ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.1)',
                  border: copiedLink ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.15)',
                  color: copiedLink ? '#10b981' : 'rgba(255,255,255,0.7)',
                  borderRadius:'8px', padding:'4px 10px',
                  fontSize:'10px', fontWeight:700, cursor:'pointer',
                  transition:'all 0.2s', flexShrink:0, whiteSpace:'nowrap',
                }}
              >{copiedLink ? '✓ Copied!' : 'Copy Link'}</button>
            </div>

            {/* WhatsApp share */}
            <button
              onClick={handleWhatsApp}
              style={{
                width:'100%', padding:'12px',
                background:'linear-gradient(135deg,#25D366,#128C7E)',
                border:'none', borderRadius:'12px',
                color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                boxShadow:'0 6px 18px rgba(37,211,102,0.35)',
                marginBottom:'10px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              Send via WhatsApp
            </button>
          </div>



          {/* Footer */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'12px' }}>
            <span style={{ fontSize:'11px' }}>🔒</span>
            <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.28)', fontWeight:500 }}>
              Secured by NPCI · 256-bit encryption · UPI verified
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes scanLine {
          0%   { top: 6px;  opacity: 1; }
          45%  { top: calc(100% - 6px); opacity: 1; }
          50%  { top: calc(100% - 6px); opacity: 0; }
          55%  { top: 6px;  opacity: 0; }
          60%  { top: 6px;  opacity: 1; }
          100% { top: 6px;  opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [qrTarget, setQrTarget] = useState<QrTarget | null>(null);

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
      {/* QR Modal */}
      {qrTarget && <QrModal target={qrTarget} onClose={() => setQrTarget(null)} />}

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
                { field: 'name', label: 'Full Name', placeholder: "User's full name", type: 'text' },
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
                <p className="text-xs text-neutral-500 mt-0.5">
                  {pagination.total} entries ·{' '}
                  <span className="font-semibold text-black">
                    {formatAmount(users.reduce((s, u) => s + u.amount, 0))} collected
                  </span>
                </p>
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
                      <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                        <p className="font-bold text-sm">{formatAmount(user.amount)}</p>
                        <p className="text-[11px] text-neutral-400">
                          {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                        {/* QR Button — opens modal on same page */}
                        <button
                          onClick={() => setQrTarget({ userId: user._id, name: user.name, amount: user.amount, shortCode: user.shortCode })}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-black text-white rounded-md px-2 py-1 hover:bg-neutral-700 active:scale-95 transition-all"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                            <path d="M14 14h2v2h-2z" /><path d="M18 14h3v3h-3z" /><path d="M14 18h3v3h-3z" /><path d="M20 20h1v1h-1z" />
                          </svg>
                          QR Pay
                        </button>
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
