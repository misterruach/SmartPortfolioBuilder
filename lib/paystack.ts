const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export async function initializePaystackPayment(input: {
  reference: string;
  amount: number;
  currency: string;
  email: string;
  name: string;
  callbackUrl: string;
  planSlug: string;
}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('Paystack is not configured.');

  // Paystack expects amounts in the smallest unit of the currency (USD cents, NGN kobo, etc.).
  const amountInSubunit = Math.round(input.amount * 100);

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: amountInSubunit,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: {
        plan_slug: input.planSlug,
        customer_name: input.name,
      },
    }),
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Paystack checkout initialization failed.');
  }

  return {
    authorizationUrl: data.data.authorization_url as string,
    reference: data.data.reference as string,
    accessCode: data.data.access_code as string,
  };
}

export async function verifyPaystackTransaction(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('Paystack is not configured.');

  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    },
  );

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Paystack transaction verification failed.');
  }

  return data.data;
}
