import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pay — Padanthara Markaz',
  description: 'Scan the UPI QR code to pay Padanthara Markaz using Google Pay, PhonePe, Paytm or any UPI app.',
  robots: 'noindex, nofollow',
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
