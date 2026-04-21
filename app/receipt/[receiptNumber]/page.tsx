'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Receipt {
  receiptNumber: string;
  amount: number;
  submittedAt: string;
  verifiedAt: string;
  status: string;
  user: {
    name: string;
    place: string;
    contact: string;
  };
  admin: {
    name: string;
    place: string;
  };
  verifiedBy: {
    name: string;
  };
  notes?: string;
}

export default function ReceiptPage() {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!receiptNumber) return;
    fetch(`/api/receipts/${receiptNumber}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setReceipt(data);
      })
      .catch(() => setError('Failed to load receipt'))
      .finally(() => setLoading(false));
  }, [receiptNumber]);

  function handlePrint() {
    window.print();
  }

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner} />
        <p>Loading receipt...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <h2>❌ {error || 'Receipt not found'}</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.receipt}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoSection}>
            <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '16px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <img src="/logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <h1 style={styles.title}>Payment Receipt</h1>
            <p style={styles.subtitle}>Padanthara Markaz</p>
          </div>
        </div>

        {/* Receipt Number & Status */}
        <div style={styles.statusBar}>
          <div style={styles.receiptNum}>
            <p style={styles.label}>Receipt #</p>
            <p style={styles.value}>{receipt.receiptNumber}</p>
          </div>
          <div style={styles.statusBadge}>
            <span style={styles.verifiedBadge}>✓ VERIFIED</span>
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.content}>
          {/* Payer Section */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Payer Information</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Name:</span>
                <span style={styles.infoValue}>{receipt.user.name}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Location:</span>
                <span style={styles.infoValue}>{receipt.user.place}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Contact:</span>
                <span style={styles.infoValue}>{receipt.user.contact}</span>
              </div>
            </div>
          </section>

          {/* Amount Section */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Payment Details</h3>
            <div style={styles.amountBox}>
              <p style={styles.amountLabel}>Amount Paid</p>
              <p style={styles.amount}>{formatAmount(receipt.amount)}</p>
            </div>
          </section>

          {/* Verification Section */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Verification Details</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Submitted:</span>
                <span style={styles.infoValue}>{formatDate(receipt.submittedAt)}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Verified On:</span>
                <span style={styles.infoValue}>{formatDate(receipt.verifiedAt)}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Verified By:</span>
                <span style={styles.infoValue}>{receipt.verifiedBy.name}</span>
              </div>
            </div>
            {receipt.notes && (
              <div style={styles.notesBox}>
                <p style={styles.notesLabel}>Notes:</p>
                <p style={styles.notesText}>{receipt.notes}</p>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            This is an electronically generated receipt and is valid without signature.
          </p>
          <p style={styles.footerDate}>
            Generated on {new Date().toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button style={styles.printBtn} onClick={handlePrint}>
          🖨️ Print Receipt
        </button>
        <button 
          style={{...styles.printBtn, background: '#64748b'}} 
          onClick={() => window.history.back()}
        >
          ← Go Back
        </button>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .actions { display: none; }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '32px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  receipt: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    maxWidth: '600px',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '48px 32px',
    textAlign: 'center',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  logoCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    opacity: 0.9,
    margin: 0,
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
  },
  receiptNum: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
  },
  value: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111',
    margin: 0,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
  },
  verifiedBadge: {
    background: '#10b981',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '24px',
    fontSize: '12px',
    fontWeight: '600',
  },
  content: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '14px',
    color: '#111',
    fontWeight: '600',
  },
  amountBox: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '24px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  amountLabel: {
    fontSize: '14px',
    margin: 0,
    opacity: 0.9,
  },
  amount: {
    fontSize: '36px',
    fontWeight: '700',
    margin: '8px 0 0 0',
  },
  notesBox: {
    background: '#fef3c7',
    padding: '16px',
    borderRadius: '8px',
    borderLeft: '4px solid #f59e0b',
  },
  notesLabel: {
    fontSize: '12px',
    color: '#92400e',
    fontWeight: '600',
    margin: 0,
    marginBottom: '8px',
  },
  notesText: {
    fontSize: '14px',
    color: '#92400e',
    margin: 0,
  },
  footer: {
    background: '#f9fafb',
    padding: '24px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
    marginBottom: '8px',
  },
  footerDate: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0,
  },
  actions: {
    marginTop: '24px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  printBtn: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '24px',
    color: '#7f1d1d',
    textAlign: 'center',
  },
};
