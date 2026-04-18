'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';

const UPI_ID = 'qr.markaz1@sib';
const PAYEE_NAME = 'Padanthara Markaz';

interface UserPayData {
  name: string;
  amount: number;
}

function buildUpiUri(amount: number): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: PAYEE_NAME,
    am: amount.toString(),
    cu: 'INR',
    tn: 'Padanthara Markaz Donation',
  });
  return `upi://pay?${params.toString()}`;
}

export default function PayPage() {
  const { userId } = useParams<{ userId: string }>();
  const [userData, setUserData] = useState<UserPayData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [scanPulse, setScanPulse] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/pay/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setUserData(data);
      })
      .catch(() => setError('Failed to load payment details'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userData) return;
    const upiUri = buildUpiUri(userData.amount);
    QRCode.toDataURL(upiUri, {
      width: 240,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(setQrDataUrl);

    // Start scan animation after QR loads
    setTimeout(() => setScanPulse(true), 500);
  }, [userData]);

  async function handleCopyUpi() {
    await navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePayNow() {
    if (!userData) return;
    window.location.href = buildUpiUri(userData.amount);
  }

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.root}>
        <div style={styles.loadingWrap}>
          <div style={styles.spinnerRing} />
          <p style={styles.loadingText}>Loading payment details…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !userData) {
    return (
      <div style={styles.root}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>✕</div>
          <h2 style={styles.errorTitle}>Payment Not Found</h2>
          <p style={styles.errorMsg}>{error || 'This payment link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoWrap}>
            <span style={styles.logoIcon}>₹</span>
          </div>
          <div style={styles.headerText}>
            <h1 style={styles.appName}>Padanthara Markaz</h1>
            <p style={styles.appSub}>Secure UPI Payment</p>
          </div>
        </div>

        {/* UPI badges */}
        <div style={styles.badgesRow}>
          {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay'].map((app) => (
            <span key={app} style={styles.badge}>{app}</span>
          ))}
        </div>

        {/* Recipient info */}
        <div style={styles.recipientCard}>
          <div style={styles.recipientAvatar}>
            {userData.name.charAt(0).toUpperCase()}
          </div>
          <div style={styles.recipientInfo}>
            <p style={styles.recipientLabel}>Pay amount collected by</p>
            <p style={styles.recipientName}>{userData.name}</p>
          </div>
          <div style={styles.verifiedBadge}>
            <span style={{ fontSize: 10 }}>✓ Verified</span>
          </div>
        </div>

        {/* Amount */}
        <div style={styles.amountBlock}>
          <p style={styles.amountLabel}>Amount to Pay</p>
          <p style={styles.amountValue}>{formatAmount(userData.amount)}</p>
          <p style={styles.amountNote}>Fixed amount — auto-filled in QR</p>
        </div>

        {/* QR Code area */}
        <div style={styles.qrSection}>
          <div style={styles.qrWrapper}>
            {/* Corner decorations */}
            <div style={{ ...styles.corner, top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }} />
            <div style={{ ...styles.corner, top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }} />
            <div style={{ ...styles.corner, bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }} />
            <div style={{ ...styles.corner, bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }} />

            {qrDataUrl ? (
              <div style={styles.qrFrame}>
                {/* Scan line animation */}
                {scanPulse && <div style={styles.scanLine} className="scan-line" />}
                <img
                  src={qrDataUrl}
                  alt="UPI QR Code"
                  style={styles.qrImg}
                  draggable={false}
                />
              </div>
            ) : (
              <div style={styles.qrPlaceholder}>
                <div style={styles.spinnerRing} />
              </div>
            )}
          </div>

          <p style={styles.scanInstruction}>
            📱 Open any UPI app → Scan QR → Pay <strong>{formatAmount(userData.amount)}</strong>
          </p>
        </div>

        {/* UPI ID row */}
        <div style={styles.upiRow}>
          <div style={styles.upiInfo}>
            <p style={styles.upiLabel}>UPI ID</p>
            <p style={styles.upiValue}>{UPI_ID}</p>
          </div>
          <button
            style={{
              ...styles.copyBtn,
              ...(copied ? styles.copyBtnCopied : {}),
            }}
            onClick={handleCopyUpi}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or pay directly</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Pay Now Button */}
        <button style={styles.payBtn} onClick={handlePayNow}>
          <span style={styles.payBtnIcon}>↗</span>
          Open UPI App & Pay {formatAmount(userData.amount)}
        </button>

        {/* App icons row */}
        <div style={styles.appsRow}>
          {[
            { name: 'GPay', color: '#4285F4', letter: 'G' },
            { name: 'PhonePe', color: '#5f259f', letter: 'P' },
            { name: 'Paytm', color: '#00B9F1', letter: 'P' },
            { name: 'BHIM', color: '#00704A', letter: 'B' },
          ].map((app) => (
            <div key={app.name} style={styles.appIcon}>
              <div style={{ ...styles.appCircle, background: app.color }}>
                <span style={styles.appLetter}>{app.letter}</span>
              </div>
              <span style={styles.appName2}>{app.name}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.lockIcon}>🔒</span>
          <span style={styles.footerText}>
            Secured by NPCI · 256-bit encryption · UPI verified
          </span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes blob-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        @keyframes scan {
          0% { top: 8px; opacity: 1; }
          45% { top: calc(100% - 8px); opacity: 1; }
          50% { top: calc(100% - 8px); opacity: 0; }
          55% { top: 8px; opacity: 0; }
          60% { top: 8px; opacity: 1; }
          100% { top: 8px; opacity: 1; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .scan-line {
          animation: scan 2.5s ease-in-out infinite !important;
        }
      `}</style>
    </div>
  );
}

// ── Inline Styles ────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Inter', -apple-system, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    top: '-120px',
    left: '-100px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
    animation: 'blob-float 8s ease-in-out infinite',
    filter: 'blur(40px)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    bottom: '-80px',
    right: '-80px',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
    animation: 'blob-float 10s ease-in-out infinite reverse',
    filter: 'blur(40px)',
    pointerEvents: 'none',
  },
  blob3: {
    position: 'absolute',
    top: '40%',
    left: '60%',
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
    animation: 'blob-float 12s ease-in-out infinite',
    filter: 'blur(30px)',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '28px',
    padding: '28px 24px',
    width: '100%',
    maxWidth: '360px',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeUp 0.6s ease forwards',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  logoWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
  },
  logoIcon: {
    fontSize: '20px',
    color: '#fff',
    fontWeight: 800,
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.3px',
    lineHeight: 1,
  },
  appSub: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
    marginTop: '3px',
    fontWeight: 500,
  },
  badgesRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
    marginBottom: '18px',
  },
  badge: {
    fontSize: '9px',
    fontWeight: 600,
    padding: '3px 7px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    letterSpacing: '0.3px',
  },
  recipientCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '12px 14px',
    marginBottom: '16px',
  },
  recipientAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 800,
    color: '#fff',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
  },
  recipientInfo: {
    flex: 1,
    minWidth: 0,
  },
  recipientLabel: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.45)',
    fontWeight: 500,
    marginBottom: '2px',
  },
  recipientName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#ffffff',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  verifiedBadge: {
    background: 'rgba(16,185,129,0.15)',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '20px',
    padding: '3px 8px',
    fontSize: '9px',
    color: '#10b981',
    fontWeight: 600,
    flexShrink: 0,
  },
  amountBlock: {
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  amountLabel: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.45)',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    marginBottom: '4px',
  },
  amountValue: {
    fontSize: '36px',
    fontWeight: 900,
    color: '#ffffff',
    letterSpacing: '-2px',
    lineHeight: 1,
    background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.7))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  amountNote: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.35)',
    marginTop: '6px',
    fontWeight: 500,
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginBottom: '18px',
  },
  qrWrapper: {
    position: 'relative' as const,
    padding: '12px',
    background: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
    marginBottom: '12px',
  },
  corner: {
    position: 'absolute' as const,
    width: '18px',
    height: '18px',
    borderColor: '#6366f1',
    borderStyle: 'solid',
    borderWidth: 0,
    borderRadius: '3px',
  },
  qrFrame: {
    position: 'relative' as const,
    display: 'inline-block',
    overflow: 'hidden',
    borderRadius: '8px',
  },
  scanLine: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #6366f1, #8b5cf6, #6366f1, transparent)',
    boxShadow: '0 0 10px 2px rgba(99,102,241,0.5)',
    zIndex: 10,
    borderRadius: '2px',
  },
  qrImg: {
    display: 'block',
    width: '200px',
    height: '200px',
    borderRadius: '6px',
  },
  qrPlaceholder: {
    width: '200px',
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
  },
  scanInstruction: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center' as const,
    lineHeight: 1.5,
    fontWeight: 500,
  },
  upiRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '10px 14px',
    marginBottom: '16px',
    gap: '8px',
  },
  upiInfo: {
    flex: 1,
    minWidth: 0,
  },
  upiLabel: {
    fontSize: '9px',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    marginBottom: '2px',
  },
  upiValue: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#a5b4fc',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  copyBtn: {
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.3)',
    color: '#a5b4fc',
    borderRadius: '10px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    flexShrink: 0,
    fontFamily: "'Inter', sans-serif",
  },
  copyBtnCopied: {
    background: 'rgba(16,185,129,0.15)',
    border: '1px solid rgba(16,185,129,0.3)',
    color: '#10b981',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  },
  payBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '18px',
    boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '-0.3px',
  },
  payBtnIcon: {
    fontSize: '17px',
    fontWeight: 900,
  },
  appsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '18px',
  },
  appIcon: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '5px',
  },
  appCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  appLetter: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#fff',
  },
  appName2: {
    fontSize: '9px',
    color: 'rgba(255,255,255,0.45)',
    fontWeight: 600,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  lockIcon: {
    fontSize: '11px',
  },
  footerText: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.3)',
    fontWeight: 500,
    textAlign: 'center' as const,
  },
  // Loading
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    fontWeight: 500,
  },
  spinnerRing: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  // Error
  errorCard: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
    padding: '40px 32px',
    textAlign: 'center' as const,
    maxWidth: '320px',
    width: '100%',
  },
  errorIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    fontSize: '20px',
    color: '#f87171',
  },
  errorTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#fff',
    marginBottom: '8px',
  },
  errorMsg: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 1.5,
  },
};
