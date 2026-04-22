'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { toast } from '@/components/ui/Toaster';

const UPI_ID = 'qr.markaz1@sib';
const PAYEE_NAME = 'Padanthara Markaz';

export interface QrTarget {
  userId: string;
  name: string;
  amount: number;
  contact: string;
  shortCode?: string;
}

function buildUpiUri(amount: number) {
  return `upi://pay?${new URLSearchParams({
    pa: UPI_ID,
    pn: PAYEE_NAME,
    am: amount.toString(),
    cu: 'INR',
    tn: 'Padanthara Markaz Donation',
  }).toString()}`;
}

export function QrModal({ target, onClose }: { target: QrTarget; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [resolvedCode, setResolvedCode] = useState<string | undefined>(target.shortCode);

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

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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

  async function handleWhatsApp() {
    let phone = target.contact.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const msg = `\u200Fالسَّلَامُ عَلَيْكُمْ\n\n\u200E*Subject: Payment Reminder - Padanthara Markaz*\n\n\u200EDear *${target.name}*,\n\n\u200EWe hope this message finds you well.\n\n\u200EThis is a formal reminder that an amount of *${formatAmount(target.amount)}* is due regarding your account at Padanthara Markaz. To ensure a smooth process, please complete the payment using the link below or by scanning the QR code via any UPI app (Google Pay, PhonePe, Paytm, etc.):\n\n\u200E🔗 ${payLink}\n\n\u200EYour prompt attention to this matter is greatly appreciated. If you have already processed this payment, please disregard this message.\n\n\u200Fجَزَاكَ اللَّهُ خَيْرًا\n\n\u200E*Devarshola Abdusalam Musliyar*\n\u200E(General Secretary Padanthara Markaz)`;
    
    try {
      if (qrDataUrl && navigator.clipboard && window.ClipboardItem) {
        const res = await fetch(qrDataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        toast('QR Code copied! Paste it in WhatsApp.', 'success');
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }

    setTimeout(() => {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }, 300);
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
        <div style={{ position:'absolute', top:'-60px', left:'-60px', width:'200px', height:'200px', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', filter:'blur(30px)', pointerEvents:'none', zIndex: 0 }} />
        <div style={{ position:'absolute', bottom:'-40px', right:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', filter:'blur(25px)', pointerEvents:'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 10, flexShrink: 0, paddingBottom: '8px' }}>
          <div style={{ display:'flex', justifyContent:'center', paddingTop:'12px', paddingBottom:'4px' }}>
            <div style={{ width:'40px', height:'4px', borderRadius:'2px', background:'rgba(255,255,255,0.2)' }} />
          </div>

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

        <div style={{ padding:'0 20px 32px', position:'relative', overflowY:'auto', flex: 1, zIndex: 10, scrollbarWidth:'none', msOverflowStyle:'none' }}>
          <style>{`::-webkit-scrollbar { display: none; }`}</style>
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

          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'12px' }}>
            {['Google Pay','PhonePe','Paytm','BHIM','Amazon Pay'].map((a) => (
              <span key={a} style={{
                fontSize:'8px', fontWeight:600, padding:'2px 7px', borderRadius:'20px',
                background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.5)',
                border:'1px solid rgba(255,255,255,0.1)', letterSpacing:'0.2px',
              }}>{a}</span>
            ))}
          </div>

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

          <div style={{ textAlign:'center', marginBottom:'12px' }}>
            <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:600, marginBottom:'2px' }}>Amount to Pay</p>
            <p style={{
              fontSize:'28px', fontWeight:900, letterSpacing:'-1px', lineHeight:1,
              background:'linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.65))',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}>{formatAmount(target.amount)}</p>
            <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', marginTop:'4px' }}>Fixed amount · auto-filled in QR</p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'20px' }}>
            <div style={{
              position:'relative', padding:'10px',
              background:'#fff', borderRadius:'14px',
              boxShadow:'0 8px 24px rgba(0,0,0,0.3)',
              marginBottom:'12px',
            }}>
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

          <div style={{ marginBottom:'12px', flexShrink: 0 }}>
            <p style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600, marginBottom:'6px' }}>
              📤 Share Payment Link
            </p>

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

export function ReceiptPoster({ data, onClose }: { data: any; onClose: () => void }) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
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
        scale: 4,
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
      const canvas = await html2canvas(posterRef.current, { scale: 3, useCORS: true });
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
      
      if (blob && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'poster.png', { type: 'image/png' })] })) {
        const file = new File([blob], `Receipt_${data.userName}.png`, { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'Payment Receipt',
          text: `Alhamdulillah! Contribution received from ${data.userName}.`,
        });
      } else {
        const msg = `\u200Fالسَّلَامُ عَلَيْكُمْ\n\n\u200E*Padanthara Markaz - Payment Receipt*\n\n\u200EAlhamdulillah! We have received your contribution.\n\n\u200E*Receipt No:* ${data.receiptNumber}\n\u200E*Payer:* ${data.userName}\n\u200E*Amount:* ${formatAmount(data.amount)}\n\u200E*Date:* ${new Date(data.date).toLocaleDateString('en-IN')}\n\n\u200Fجَزَاكَ اللَّهُ خَيْرًا\n\n\u200E*Devarshola Abdusalam Musliyar*\n\u200E(General Secretary Padanthara Markaz)`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        toast('Direct image share not supported. Using WhatsApp text instead.', 'info');
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
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', animation: 'fadeIn 0.3s ease'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '100%', maxWidth: '420px', display:'flex', flexDirection:'column', gap:'16px' }}>
        <div 
          ref={posterRef}
          style={{
            background: 'linear-gradient(135deg, #054a32 0%, #065f46 100%)',
            borderRadius: '0', 
            position: 'relative',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
            overflow: 'hidden', padding: '70px 40px',
            textAlign: 'center', color: '#fff',
            border: '12px double rgba(193, 155, 60, 0.3)',
            aspectRatio: '1080/1920', display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', boxSizing: 'border-box'
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 50%, #fbbf24 0%, transparent 70%)' }} />
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            {logoDataUrl && (
              <div style={{ 
                width: '75px', height: '75px', background: '#fff', 
                borderRadius: '50%', padding: '10px', margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}>
                <img src={logoDataUrl} alt="Logo" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
              </div>
            )}
            <h1 style={{ fontSize: '12px', letterSpacing: '4px', fontWeight: 900, color: '#fbbf24', marginBottom: '4px' }}>Alhamdulillah</h1>
            <p style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '2px', fontWeight: 600 }}>OFFICIAL CONTRIBUTION RECEIPT</p>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <p style={{ fontSize: '14px', fontWeight: 500, opacity: 0.9, marginBottom: '6px' }}>Presented with Gratitude to</p>
            <h2 style={{ fontSize: '30px', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{data.userName}</h2>
            <div style={{ width: '40px', height: '3px', background: '#fbbf24', margin: '12px auto' }} />
            <p style={{ fontSize: '16px', color: '#6ee7b7', fontWeight: 600 }}>{data.place}</p>
          </div>

          <div style={{ 
            position: 'relative', zIndex: 2,
            background: 'rgba(255,255,255,0.06)', 
            borderRadius: '24px', 
            padding: '25px 20px', 
            border: '1px solid rgba(251, 191, 36, 0.25)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: 800, marginBottom: '8px', letterSpacing: '1px' }}>AMOUNT CONTRIBUTED</p>
            <p style={{ fontSize: '44px', fontWeight: 900, color: '#fbbf24', letterSpacing: '-1.5px', lineHeight: 1 }}>{formatAmount(data.amount)}</p>
            <p style={{ fontSize: '10px', color: '#d1fae5', marginTop: '12px', opacity: 0.8, fontStyle: 'italic' }}>
              "May Allah accept and bless your generosity."
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
             <div style={{ marginBottom: '18px' }}>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>Devarshola Abdusalam Musliyar</p>
                <p style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: 700 }}>General Secretary Padanthara Markaz</p>
             </div>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '15px' }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '9px', color: '#6ee7b7', fontWeight: 800 }}>DATE</p>
                  <p style={{ fontSize: '12px', fontWeight: 800 }}>{new Date(data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '12px', fontWeight: 900, color: '#fbbf24' }}>PADANTHARA MARKAZ</p>
                  <p style={{ fontSize: '10px', fontFamily: 'monospace', opacity: 0.6 }}>#{data.receiptNumber}</p>
                </div>
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleShareImage}
            disabled={generating}
            style={{ 
              width: '100%', background: '#25D366', color: '#fff', border: 'none', 
              padding: '14px', borderRadius: '16px', fontWeight: 800, fontSize: '14px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.2s', opacity: generating ? 0.7 : 1
            }}
          >
            {generating ? 'Processing...' : 'Share directly to WhatsApp'}
          </button>
          
          <button
            onClick={handleDownloadImage}
            disabled={generating}
            style={{ 
              width: '100%', background: 'rgba(255,255,255,0.1)', color: '#fff', 
              border: '1px solid rgba(255,255,255,0.15)', padding: '14px', borderRadius: '16px', 
              fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {generating ? 'Please wait...' : 'Download to Gallery'}
          </button>
          
          <button
            onClick={onClose}
            style={{ 
              alignSelf: 'center', background: 'transparent', border: 'none', 
              color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600, 
              cursor: 'pointer', padding: '10px' 
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
