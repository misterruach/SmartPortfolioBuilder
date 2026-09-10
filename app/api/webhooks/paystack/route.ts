import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { verifyPaystackTransaction } from '@/lib/paystack';

function signaturesMatch(rawBody: string, signature: string, secret: string) {
  const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature || '', 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return new NextResponse('Paystack is not configured', { status: 500 });

    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';
    if (!signaturesMatch(rawBody, signature, secret)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = JSON.parse(rawBody);
    if (body.event !== 'charge.success') return NextResponse.json({ ok: true });

    const reference = body.data?.reference;
    if (!reference) return NextResponse.json({ ok: true });

    const db = getAdminSupabase();
    const { data: payment, error: paymentError } = await db
      .from('payments')
      .select('*')
      .eq('provider', 'paystack')
      .eq('provider_transaction_id', reference)
      .single();
    if (paymentError || !payment) return NextResponse.json({ ok: true });
    if (payment.status === 'successful') return NextResponse.json({ ok: true });

    const transaction = await verifyPaystackTransaction(reference);
    const expectedAmount = Math.round(Number(payment.amount) * 100);
    const currencyMatches = String(transaction.currency || '').toUpperCase() === String(payment.currency || '').toUpperCase();

    if (transaction.status !== 'success' || Number(transaction.amount) !== expectedAmount || !currencyMatches) {
      await db.from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', payment.id);
      return new NextResponse('Payment verification failed', { status: 400 });
    }

    const { data: planRow, error: planError } = await db
      .from('plans')
      .select('id,project_limit,ai_action_limit,portfolio_duration_days')
      .eq('id', payment.plan_id)
      .single();
    if (planError || !planRow) throw new Error('Plan missing.');

    await db.from('payments').update({
      status: 'successful',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', payment.id);

    await db.from('user_plans')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('user_id', payment.user_id)
      .eq('status', 'active');

    const startedAt = new Date();
    const durationDays = Number(planRow.portfolio_duration_days || 365);
    const expiresAt = new Date(startedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
    await db.from('user_plans').insert({
      user_id: payment.user_id,
      plan_id: planRow.id,
      status: 'active',
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      projects_granted: planRow.project_limit,
      ai_actions_granted: planRow.ai_action_limit,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Webhook processing failed' }, { status: 500 });
  }
}
