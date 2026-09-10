import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { initializePaystackPayment } from '@/lib/paystack';
import { PLANS } from '@/lib/plans';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { planSlug } = await req.json();
    const plan = PLANS.find((x) => x.slug === planSlug);

    if (!plan || !plan.price) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const db = await getServerSupabase();
    const { data: profile } = await db
      .from('profiles')
      .select('name,email')
      .eq('id', user.id)
      .single();

    const reference = `spb-${user.id.slice(0, 8)}-${Date.now()}`;

    const { data: planRow, error: planError } = await db
      .from('plans')
      .select('id')
      .eq('slug', plan.slug)
      .single();
    if (planError || !planRow) throw new Error('Plan is not configured in Supabase.');

    const { error: paymentError } = await db.from('payments').insert({
      user_id: user.id,
      plan_id: planRow.id,
      provider: 'paystack',
      provider_transaction_id: reference,
      amount: plan.price,
      currency: 'USD',
      status: 'pending',
      payment_type: 'plan',
      metadata: { plan_slug: plan.slug },
    });
    if (paymentError) throw paymentError;

    const payment = await initializePaystackPayment({
      reference,
      amount: plan.price,
      currency: 'USD',
      email: profile?.email || user.email!,
      name: profile?.name || 'Customer',
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      planSlug: plan.slug,
    });

    return NextResponse.json({ url: payment.authorizationUrl, reference: payment.reference });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Payment initialization failed' }, { status: 500 });
  }
}
