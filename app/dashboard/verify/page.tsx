'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toaster';

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    name: string;
    place: string;
    contact: string;
    amount: number;
  };
  amount: number;
  status: 'pending' | 'submitted' | 'verified' | 'rejected';
  submittedAt: string;
  receiptNumber?: string;
  notes?: string;
}

export default function AdminVerifyPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'submitted' | 'verified' | 'rejected'>('submitted');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/transactions');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth');
          return;
        }
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data);
      setError('');
    } catch {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTransactions();
    // Refresh every 10 seconds
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  async function handleVerify(transactionId: string, newStatus: 'verified' | 'rejected') {
    if (!transactionId) return;

    setVerifyingId(transactionId);
    try {
      const response = await fetch(`/api/transactions/verify/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: verifyNotes || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast(`Payment ${newStatus} successfully!`, 'success');
        setVerifyNotes('');
        setShowNotesInput(false);
        fetchTransactions();
      } else {
        toast(data.error || 'Failed to verify payment', 'error');
      }
    } catch {
      toast('Error verifying payment', 'error');
    } finally {
      setVerifyingId(null);
    }
  }

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTransactions = transactions.filter((t) => t.status === selectedTab);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner} />
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Payment Verification</h1>
        <p style={styles.subtitle}>Review and verify user payments</p>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.tabsContainer}>
        {(['submitted', 'verified', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(selectedTab === tab ? styles.tabActive : {}),
            }}
            onClick={() => setSelectedTab(tab)}
          >
            {tab === 'submitted' && '⏳ Pending'}
            {tab === 'verified' && '✓ Verified'}
            {tab === 'rejected' && '✕ Rejected'}
            <span style={styles.tabCount}>
              ({transactions.filter((t) => t.status === tab).length})
            </span>
          </button>
        ))}
      </div>

      <div style={styles.transactionsList}>
        {filteredTransactions.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>📋</p>
            <p style={styles.emptyText}>No {selectedTab} transactions</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction._id} style={styles.transactionCard}>
              <div style={styles.cardHeader}>
                <div style={styles.userInfo}>
                  <div style={styles.userAvatar}>
                    {transaction.userId.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.userDetails}>
                    <h3 style={styles.userName}>{transaction.userId.name}</h3>
                    <p style={styles.userLocation}>{transaction.userId.place}</p>
                    <p style={styles.userContact}>{transaction.userId.contact}</p>
                  </div>
                </div>
                <div style={styles.amountSection}>
                  <p style={styles.amountLabel}>Amount</p>
                  <p style={styles.amount}>{formatAmount(transaction.amount)}</p>
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Submitted:</span>
                  <span style={styles.infoValue}>{formatDate(transaction.submittedAt)}</span>
                </div>
                {transaction.receiptNumber && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Receipt:</span>
                    <span style={styles.infoValue}>{transaction.receiptNumber}</span>
                  </div>
                )}
              </div>

              {selectedTab === 'submitted' && (
                <div style={styles.cardActions}>
                  <button
                    style={styles.verifyBtn}
                    onClick={() => {
                      setShowNotesInput(true);
                      setVerifyingId(transaction._id);
                    }}
                  >
                    ✓ Verify
                  </button>
                  <button
                    style={styles.rejectBtn}
                    onClick={() => handleVerify(transaction._id, 'rejected')}
                    disabled={verifyingId === transaction._id}
                  >
                    {verifyingId === transaction._id ? '⏳...' : '✕ Reject'}
                  </button>
                </div>
              )}

              {showNotesInput && verifyingId === transaction._id && (
                <div style={styles.notesSection}>
                  <textarea
                    style={styles.notesInput}
                    placeholder="Add notes (optional)..."
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                  />
                  <div style={styles.notesActions}>
                    <button
                      style={styles.confirmVerifyBtn}
                      onClick={() => handleVerify(transaction._id, 'verified')}
                      disabled={verifyingId === transaction._id}
                    >
                      {verifyingId === transaction._id ? '⏳...' : 'Confirm Verify'}
                    </button>
                    <button
                      style={styles.cancelBtn}
                      onClick={() => {
                        setShowNotesInput(false);
                        setVerifyingId(null);
                        setVerifyNotes('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '32px 16px',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  header: {
    maxWidth: '1000px',
    margin: '0 auto 32px',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: 800,
    color: '#1f2937',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '8px 0 0 0',
  },
  errorBanner: {
    maxWidth: '1000px',
    margin: '0 auto 24px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '16px',
    color: '#7f1d1d',
    fontSize: '14px',
  },
  tabsContainer: {
    maxWidth: '1000px',
    margin: '0 auto 24px',
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid #e5e7eb',
  },
  tab: {
    background: 'transparent',
    border: 'none',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#6b7280',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.3s',
  },
  tabActive: {
    color: '#667eea',
    borderBottomColor: '#667eea',
  },
  tabCount: {
    fontSize: '12px',
    opacity: 0.7,
  },
  transactionsList: {
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  transactionCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
  },
  userInfo: {
    display: 'flex',
    gap: '12px',
    flex: 1,
  },
  userAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '18px',
    fontWeight: 700,
    flexShrink: 0,
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  userName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
  },
  userLocation: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '2px 0 0 0',
  },
  userContact: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '2px 0 0 0',
  },
  amountSection: {
    textAlign: 'right' as const,
  },
  amountLabel: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
  },
  amount: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#667eea',
    margin: '4px 0 0 0',
  },
  cardBody: {
    padding: '16px 20px',
    background: '#f9fafb',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '8px',
  },
  infoLabel: {
    color: '#6b7280',
    fontWeight: 500,
  },
  infoValue: {
    color: '#1f2937',
    fontWeight: 600,
  },
  cardActions: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
  },
  verifyBtn: {
    flex: 1,
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  rejectBtn: {
    flex: 1,
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  notesSection: {
    padding: '16px 20px',
    background: '#f3f4f6',
    borderTop: '1px solid #e5e7eb',
  },
  notesInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    fontFamily: "'Inter', -apple-system, sans-serif",
    marginBottom: '12px',
    resize: 'vertical' as const,
    minHeight: '80px',
  },
  notesActions: {
    display: 'flex',
    gap: '12px',
  },
  confirmVerifyBtn: {
    flex: 1,
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    background: '#e5e7eb',
    color: '#374151',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 20px',
    background: 'white',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '48px',
    margin: '0 0 12px 0',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '100px auto 0',
  },
};
