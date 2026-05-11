import { corsHeaders } from '../_shared/cors.ts';
import { getPlanId, getRazorpayClient } from '../_shared/razorpay.ts';

const VALID_PLANS = new Set(['starter', 'growth', 'addon_bot']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, plan, billingPeriod } = await req.json();
    const normalizedPlan = typeof plan === 'string' ? plan.trim().toLowerCase() : '';

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!VALID_PLANS.has(normalizedPlan)) {
      return new Response(JSON.stringify({ error: 'plan must be starter, growth, or addon_bot' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (billingPeriod && billingPeriod !== 'monthly' && billingPeriod !== 'annual') {
      return new Response(JSON.stringify({ error: 'billingPeriod must be monthly or annual' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const razorpay = getRazorpayClient();
    const resolvedBillingPeriod = normalizedPlan === 'addon_bot'
      ? 'monthly'
      : billingPeriod === 'annual'
        ? 'annual'
        : 'monthly';

    const subscription = await razorpay.subscriptions.create({
      plan_id: getPlanId(normalizedPlan as 'starter' | 'growth' | 'addon_bot', resolvedBillingPeriod),
      total_count: 10,
      customer_notify: 1,
      notes: {
        userId,
        plan: normalizedPlan,
        billingPeriod: resolvedBillingPeriod,
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
    const body =
      err.body && typeof err.body === 'object'
        ? (err.body as Record<string, unknown>)
        : undefined;
    const bodyError =
      body?.error && typeof body.error === 'object'
        ? (body.error as Record<string, unknown>)
        : undefined;
    const message =
      typeof err.error === 'string'
        ? err.error
        : typeof nestedError?.description === 'string'
          ? nestedError.description
          : typeof nestedError?.reason === 'string'
            ? nestedError.reason
            : typeof bodyError?.description === 'string'
              ? bodyError.description
              : typeof bodyError?.reason === 'string'
                ? bodyError.reason
        : typeof err.description === 'string'
          ? err.description
          : error instanceof Error
            ? error.message
            : 'Failed to create subscription';
    const status = typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
      ? err.statusCode
      : 500;

    console.error('create-subscription failed', {
      message,
      status,
      errorType: typeof error,
      raw: err,
    });

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
