import Link from 'next/link';

export default function PaymentCallback({ searchParams }: { searchParams: Promise<{ reference?: string; trxref?: string }> }) {
  return <PaymentResult searchParams={searchParams} />;
}

async function PaymentResult({ searchParams }: { searchParams: Promise<{ reference?: string; trxref?: string }> }) {
  const params = await searchParams;
  const reference = params.reference || params.trxref;

  return (
    <main className="page">
      <div className="glass price" style={{ maxWidth: 680, margin: '80px auto', textAlign: 'center' }}>
        <span className="eyebrow">PAYMENT RECEIVED</span>
        <h1>Thanks — we’re confirming your payment.</h1>
        <p>Your Paystack transaction is being verified securely. Your plan will appear in your dashboard once verification completes.</p>
        {reference && <p className="muted">Reference: {reference}</p>}
        <Link className="btn btn-primary" href="/dashboard">Go to dashboard</Link>
      </div>
    </main>
  );
}
