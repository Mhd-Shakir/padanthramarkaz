'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/components/ui/Toaster';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

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
  transactionStatus?: 'pending' | 'submitted' | 'verified' | 'rejected';
  receiptNumber?: string;
  verifiedAt?: string;
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
      width: 140,
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
    const msg = `السَّلَامُ عَلَيْكُمْ\n\n*Subject: Payment Reminder - Padanthara Markaz*\n\nDear *${target.name}*,\n\nWe hope this message finds you well.\n\nThis is a formal reminder that an amount of *${formatAmount(target.amount)}* is due regarding your account at Padanthara Markaz. To ensure a smooth process, please complete the payment using the link below or by scanning the QR code via any UPI app (Google Pay, PhonePe, Paytm, etc.):\n\n🔗 ${payLink}\n\nYour prompt attention to this matter is greatly appreciated. If you have already processed this payment, please disregard this message.\n\nجَزَاكَ اللَّهُ خَيْرًا\n\n*Administration*\nPadanthara Markaz`;
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
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow blobs */}
        <div style={{ position:'absolute', top:'-60px', left:'-60px', width:'200px', height:'200px', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', filter:'blur(30px)', pointerEvents:'none', zIndex: 0 }} />
        <div style={{ position:'absolute', bottom:'-40px', right:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', filter:'blur(25px)', pointerEvents:'none', zIndex: 0 }} />

        {/* Fixed Header / Handle */}
        <div style={{ position: 'relative', zIndex: 10, flexShrink: 0, paddingBottom: '8px' }}>
          {/* Drag handle */}
          <div style={{ display:'flex', justifyContent:'center', paddingTop:'12px', paddingBottom:'4px' }}>
            <div style={{ width:'40px', height:'4px', borderRadius:'2px', background:'rgba(255,255,255,0.2)' }} />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position:'absolute', top:'12px', right:'16px',
              width:'30px', height:'30px', borderRadius:'50%',
              background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)',
              color:'rgba(255,255,255,0.6)', fontSize:'16px', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              lineHeight:1, zIndex: 20
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding:'0 20px 32px', position:'relative', overflowY:'auto', flex: 1, zIndex: 10, scrollbarWidth:'none', msOverflowStyle:'none' }}>
          <style>{`::-webkit-scrollbar { display: none; }`}</style>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
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
          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'12px' }}>
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
            borderRadius:'14px', padding:'8px 10px', marginBottom:'12px',
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
          <div style={{ textAlign:'center', marginBottom:'12px' }}>
            <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:600, marginBottom:'2px' }}>Amount to Pay</p>
            <p style={{
              fontSize:'28px', fontWeight:900, letterSpacing:'-1px', lineHeight:1,
              background:'linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.65))',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}>{formatAmount(target.amount)}</p>
            <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', marginTop:'4px' }}>Fixed amount · auto-filled in QR</p>
          </div>

          {/* QR Code */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'20px' }}>
            <div style={{
              position:'relative', padding:'10px',
              background:'#fff', borderRadius:'14px',
              boxShadow:'0 8px 24px rgba(0,0,0,0.3)',
              marginBottom:'12px',
            }}>
              {/* Corner decorators */}
              {[
                { top:0, left:0, borderTopWidth:3, borderLeftWidth:3 },
                { top:0, right:0, borderTopWidth:3, borderRightWidth:3 },
                { bottom:0, left:0, borderBottomWidth:3, borderLeftWidth:3 },
                { bottom:0, right:0, borderBottomWidth:3, borderRightWidth:3 },
              ].map((s, i) => (
                <div key={i} style={{
                  position:'absolute', width:'14px', height:'14px',
                  borderColor:'#6366f1', borderStyle:'solid', borderWidth:0,
                  borderRadius:'3px', ...s,
                }} />
              ))}

              {qrDataUrl ? (
                <div style={{ position:'relative', overflow:'hidden', borderRadius:'4px' }}>
                  <div style={{
                    position:'absolute', left:0, right:0, height:'2px',
                    background:'linear-gradient(90deg,transparent,#6366f1,#8b5cf6,#6366f1,transparent)',
                    boxShadow:'0 0 8px 2px rgba(99,102,241,0.5)',
                    zIndex:10, borderRadius:'2px',
                    animation:'scanLine 2.5s ease-in-out infinite',
                  }} />
                  <img src={qrDataUrl} alt="UPI QR" style={{ display:'block', width:'140px', height:'140px', borderRadius:'4px' }} />
                </div>
              ) : (
                <div style={{
                  width:'140px', height:'140px',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <div style={{
                    width:'28px', height:'28px',
                    border:'3px solid rgba(0,0,0,0.1)', borderTopColor:'#6366f1',
                    borderRadius:'50%', animation:'spin 0.8s linear infinite',
                  }} />
                </div>
              )}
            </div>
            <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', textAlign:'center', lineHeight:1.4, fontWeight:500 }}>
              📱 Open any UPI app → Scan QR → Pay <strong style={{ color:'#fff' }}>{formatAmount(target.amount)}</strong>
            </p>
          </div>

          {/* UPI ID row */}
          <div style={{
            display:'flex', alignItems:'center', gap:'8px',
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'12px', padding:'8px 12px', marginBottom:'12px',
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
          <div style={{ marginBottom:'12px', flexShrink: 0 }}>
            <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600, marginBottom:'6px' }}>
              📤 Share Payment Link
            </p>

            {/* Link display + copy */}
            <div style={{
              display:'flex', alignItems:'center', gap:'6px',
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:'12px', padding:'8px 12px', marginBottom:'6px',
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
                width:'100%', padding:'10px',
                background:'linear-gradient(135deg,#25D366,#128C7E)',
                border:'none', borderRadius:'10px',
                color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
                boxShadow:'0 4px 14px rgba(37,211,102,0.35)',
                marginBottom:'8px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              Send via WhatsApp
            </button>
          </div>



          {/* Footer */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'14px', paddingBottom:'8px' }}>
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

// ── Receipt Poster Modal ──────────────────────────────────────────────────────
function ReceiptPoster({ data, onClose }: { data: any; onClose: () => void }) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    // Pre-load logo as data URL for html2canvas compatibility
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/logo.png';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setLogoDataUrl(canvas.toDataURL('image/png'));
      }
    };
  }, []);

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  async function handleDownloadImage() {
    if (!posterRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3, // High quality
        useCORS: true,
        backgroundColor: '#064e3b',
      });
      const link = document.createElement('a');
      link.download = `Receipt_${data.userName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast('Poster ready for download!', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to generate image', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function handleShareImage() {
    if (!posterRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(posterRef.current, { scale: 2, useCORS: true });
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
      
      if (blob && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'poster.png', { type: 'image/png' })] })) {
        const file = new File([blob], `Receipt_${data.userName}.png`, { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'Payment Receipt',
          text: `Alhamdulillah! Contribution received from ${data.userName}.`,
        });
      } else {
        // Fallback to text share if web share fails or not supported for files
        const msg = `السَّلَامُ عَلَيْكُمْ\n\n*Padanthara Markaz - Payment Receipt*\n\nAlhamdulillah! We have received your contribution.\n\n*Receipt No:* ${data.receiptNumber}\n*Payer:* ${data.userName}\n*Amount:* ${formatAmount(data.amount)}\n*Date:* ${new Date(data.date).toLocaleDateString('en-IN')}\n\nجَزَاكَ اللَّهُ خَيْرًا`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        toast('Direct image share not supported on this browser. Use Download instead.', 'info');
      }
    } catch (err) {
      console.error(err);
      toast('Could not share image', 'error');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', animation: 'fadeIn 0.3s ease'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* The capture area */}
        <div 
          ref={posterRef}
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
            borderRadius: '24px', position: 'relative',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            overflow: 'hidden', padding: '45px 35px',
            textAlign: 'center', color: '#fff',
            border: '8px double rgba(251, 191, 36, 0.15)',
          }}
        >
          {/* Islamic Ornament Decor */}
          <div style={{ position: 'absolute', top: '-15px', left: '-15px', opacity: 0.1, fontSize: '100px', userSelect: 'none' }}>۞</div>
          <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', opacity: 0.1, fontSize: '100px', userSelect: 'none' }}>۞</div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {logoDataUrl && (
              <div style={{ 
                width: '70px', height: '70px', background: '#fff', 
                borderRadius: '15px', padding: '6px', margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
              }}>
                <img 
                  src={logoDataUrl} 
                  alt="Logo" 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                />
              </div>
            )}
            <h1 style={{ fontSize: '14px', letterSpacing: '4px', fontWeight: 800, color: '#fbbf24', marginBottom: '8px' }}>ALHAMDULILLAH</h1>
            <div style={{ width: '50px', height: '2px', background: 'rgba(251, 191, 36, 0.3)', margin: '0 auto 28px' }} />

            <p style={{ fontSize: '11px', opacity: 0.8, letterSpacing: '1px', marginBottom: '4px' }}>OFFICIAL PAYMENT RECEIPT</p>
            <p style={{ fontSize: '10px', fontFamily: 'monospace', color: '#fbbf24', marginBottom: '35px', fontWeight: 600 }}>#{data.receiptNumber}</p>

            <p style={{ fontSize: '14px', marginBottom: '6px', fontWeight: 500 }}>Presented To</p>
            <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '4px', textShadow: '0 2px 8px rgba(0,0,0,0.3)', color: '#fff' }}>{data.userName}</h2>
            <p style={{ fontSize: '14px', color: '#d1fae5', marginBottom: '35px', fontWeight: 500 }}>{data.place}</p>

            <div style={{ 
              background: 'rgba(255,255,255,0.07)', 
              borderRadius: '20px', 
              padding: '24px 20px', 
              marginBottom: '35px', 
              border: '1px solid rgba(251, 191, 36, 0.2)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 700, marginBottom: '6px', letterSpacing: '1px' }}>CONTRIBUTION AMOUNT</p>
              <p style={{ fontSize: '38px', fontWeight: 900, color: '#fbbf24', letterSpacing: '-1px' }}>{formatAmount(data.amount)}</p>
            </div>

            <p style={{ fontSize: '12px', color: '#d1fae5', marginBottom: '20px', fontStyle: 'italic', lineHeight: 1.5, padding: '0 10px' }}>
              "May Allah accept your donation and bless you and your family with abundance."
            </p>

            <div style={{ marginBottom: '30px' }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>DR Devershola Abdul Salam Musliyar</p>
              <p style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: 600 }}>(General Secretary Padanthara Markaz)</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '22px' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '9px', color: '#6ee7b7', fontWeight: 700, marginBottom: '2px' }}>DATE</p>
                <p style={{ fontSize: '13px', fontWeight: 700 }}>{new Date(data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', fontWeight: 900, color: '#fbbf24', marginBottom: '1px' }}>PADANTHARA MARKAZ</p>
                <p style={{ fontSize: '9px', fontWeight: 700, opacity: 0.7 }}>CERTIFIED RECEIPT</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons - outside capture area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={handleShareImage}
            disabled={generating}
            style={{ 
              width: '100%', background: '#25D366', color: '#fff', border: 'none', 
              padding: '14px', borderRadius: '14px', fontWeight: 800, fontSize: '14px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              gap: '10px', boxShadow: '0 10px 25px rgba(37,211,102,0.2)',
              transition: 'all 0.2s', opacity: generating ? 0.7 : 1
            }}
          >
            {generating ? 'Processing...' : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                Share Image
              </>
            )}
          </button>
          
          <button
            onClick={handleDownloadImage}
            disabled={generating}
            style={{ 
              width: '100%', background: 'rgba(255,255,255,0.15)', color: '#fff', 
              border: '1px solid rgba(255,255,255,0.2)', padding: '14px', borderRadius: '14px', 
              fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {generating ? 'Please wait...' : 'Download to Gallery'}
          </button>
          
          <button
            onClick={onClose}
            style={{ 
              alignSelf: 'center', background: 'transparent', border: 'none', 
              color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, 
              cursor: 'pointer', padding: '10px', marginTop: '5px' 
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [posterData, setPosterData] = useState<any | null>(null);
  const [instantLoading, setInstantLoading] = useState<string | null>(null);

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
      
      if (!res.ok) {
        console.error('Failed to fetch users:', data);
        toast(data.error || 'Failed to load users', 'error');
        setUsers([]);
        setPagination({ total: 0, page: 1, pages: 1 });
        return;
      }
      
      setUsers(Array.isArray(data.users) ? data.users : []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      console.error('Error fetching users:', err);
      toast('Failed to load users', 'error');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchUsers();
  }, [session, fetchUsers]);

  const fetchTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const res = await fetch('/api/admin/transactions');
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      toast('Failed to load transactions', 'error');
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchTransactions();
      const interval = setInterval(fetchTransactions, 10000);
      return () => clearInterval(interval);
    }
  }, [session, fetchTransactions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.place || !form.contact || !form.amount) {
      toast('All fields are required', 'error');
      return;
    }

    // Validate amount
    const amountNum = Number(form.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast('Amount must be a valid positive number', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: amountNum }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast(data.error || 'Failed to add user', 'error');
        return;
      }

      if (data.user && data.user._id) {
        toast('User added successfully!', 'success');
        setForm(initialForm);
        fetchUsers(1);
      } else {
        toast('User added but response is incomplete', 'error');
      }
    } catch (err) {
      console.error('Error adding user:', err);
      toast('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    // Immediate redirect for better UX
    router.push('/auth');
    // Still trigger session clearing but don't wait for it
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }

  async function handleVerifyPayment(transactionId: string) {
    setVerifyingId(transactionId);
    try {
      const res = await fetch(`/api/transactions/verify/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'verified', notes: 'Verified by admin' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast('Payment verified successfully!', 'success');
        fetchTransactions();
        // Show poster
        if (data.transaction) {
          // Find the transaction in local state to get user details
          const tx = transactions.find(t => t._id === transactionId);
          setPosterData({
            receiptNumber: data.transaction.receiptNumber,
            userName: tx?.userId?.name || 'User',
            place: tx?.userId?.place || '',
            amount: data.transaction.amount || tx?.amount,
            date: data.transaction.verifiedAt || new Date().toISOString()
          });
        }
      } else {
        toast(data.error || 'Failed to verify payment', 'error');
      }
    } catch {
      toast('Error verifying payment', 'error');
    } finally {
      setVerifyingId(null);
    }
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
        setPosterData(data.transaction);
        // Update local state so checkbox reflects change immediately
        setUsers(prev => prev.map(u => 
          u._id === user._id 
            ? { ...u, transactionStatus: 'verified', receiptNumber: data.transaction.receiptNumber } 
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
      {/* Poster Modal */}
      {posterData && <ReceiptPoster data={posterData} onClose={() => setPosterData(null)} />}

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
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="text-xs text-neutral-400 hover:text-black transition-colors font-medium border-r border-neutral-200 pr-3"
            >
              ← Home
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-neutral-500 hover:text-black transition-colors border border-neutral-200 rounded px-3 py-1.5 hover:border-black font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        {/* Top Section: Add User Form + Payment Verification */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-8 mb-8">
          {/* Add User Form */}
          <div className="lg:col-span-2">
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
                disabled={submitting || !form.name || !form.place || !form.contact || !form.amount}
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

        {/* Payment Verification  */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-5 border-b border-neutral-100">
              <h2 className="font-black text-lg tracking-tight">Payment Verification</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Verify and approve submitted payments</p>
            </div>

            {transactionsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 skeleton rounded-lg" />
                ))}
              </div>
            ) : !Array.isArray(transactions) || transactions.filter((t) => t.status === 'submitted').length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-sm">
                ✓ No pending payments to verify
              </div>
            ) : (
              <div className="divide-y">
                {transactions
                  .filter((t) => t.status === 'submitted')
                  .map((transaction) => (
                    <div key={transaction._id} className="p-4 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-black">{transaction.userId.name}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {transaction.userId.place} · {transaction.userId.contact}
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            Submitted: {new Date(transaction.submittedAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-black">{formatAmount(transaction.amount)}</p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setQrTarget({ userId: transaction.userId._id, name: transaction.userId.name, amount: transaction.amount, shortCode: transaction.userId.shortCode })}
                            className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors group"
                            title="Show QR Code"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400 group-hover:text-black">
                              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                              <path d="M14 14h2v2h-2z" /><path d="M18 14h3v3h-3z" /><path d="M14 18h3v3h-3z" /><path d="M20 20h1v1h-1z" />
                            </svg>
                          </button>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={verifyingId === transaction._id}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleVerifyPayment(transaction._id);
                                }
                              }}
                              className="w-5 h-5 rounded border-neutral-300 accent-black transition-all"
                            />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-black leading-none mb-0.5">
                                {verifyingId === transaction._id ? 'Verifying...' : 'VERIFY'}
                              </span>
                              <span className="text-[9px] text-neutral-400 leading-none">
                                Generate Poster
                              </span>
                            </div>
                          </label>
                        </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Users List - Full Width Below */}
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
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setQrTarget({ userId: user._id, name: user.name, amount: user.amount, shortCode: user.shortCode })}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors group"
                            title="QR Pay"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400 group-hover:text-black">
                              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                              <path d="M14 14h2v2h-2z" /><path d="M18 14h3v3h-3z" /><path d="M14 18h3v3h-3z" /><path d="M20 20h1v1h-1z" />
                            </svg>
                          </button>
                          
                          <label className="flex items-center gap-2 cursor-pointer" title={user.transactionStatus === 'verified' ? "Payment Verified" : "Verify & Create Poster"}>
                            <input
                              type="checkbox"
                              checked={user.transactionStatus === 'verified'}
                              disabled={instantLoading === user._id || user.transactionStatus === 'verified'}
                              onChange={(e) => {
                                if (e.target.checked && user.transactionStatus !== 'verified') {
                                  handleInstantVerify(user);
                                }
                              }}
                              className={`w-5 h-5 rounded border-neutral-300 accent-black transition-all ${user.transactionStatus === 'verified' ? 'opacity-100' : ''}`}
                            />
                            <span className={`text-[10px] font-bold ${user.transactionStatus === 'verified' ? 'text-green-600' : 'text-neutral-400'}`}>
                              {instantLoading === user._id ? '...' : user.transactionStatus === 'verified' ? 'VERIFIED' : ''}
                            </span>
                          </label>
                          
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
                        </div>
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
      </main>
    </div>
  );
}
