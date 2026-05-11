import { corsHeaders } from '../_shared/cors.ts';
import { getRazorpayClient } from '../_shared/razorpay.ts';

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
    const order = await razorpay.orders.create({
      amount: 1000,
      currency: 'INR',
      receipt: `activation_${userId}_${Date.now()}`,
      notes: {
        type: 'activation',
        userId,
      },
    });

    return new Response(JSON.stringify({ orderId: order.id, amount: 1000 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create activation order';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
