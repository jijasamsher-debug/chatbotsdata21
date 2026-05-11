import { corsHeaders } from '../_shared/cors.ts';
import { getPlanId, getRazorpayClient } from '../_shared/razorpay.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const razorpay = getRazorpayClient();

    const subscription = await razorpay.subscriptions.create({
      plan_id: getPlanId('addon_bot', 'monthly'),
      total_count: 12,
      customer_notify: 1,
      notes: {
        userId,
        plan: 'addon_bot',
        billingPeriod: 'monthly',
      },
    });

    return new Response(JSON.stringify({ subscriptionId: subscription.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const isObj = typeof error === 'object' && error !== null;
    const err = isObj ? (error as Record<string, unknown>) : {};
    const nestedError =
      err.error && typeof err.error === 'object'
        ? (err.error as Record<string, unknown>)
        : undefined;
    const message =
      typeof nestedError?.description === 'string'
        ? nestedError.description
        : error instanceof Error
          ? error.message
          : 'Failed to create addon subscription';

    console.error('create-addon-order failed', { message, raw: err });

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
