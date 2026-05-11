declare global {
  interface Window {
    Razorpay: any;
  }
}

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  (import.meta.env.VITE_SUPABASE_PROJECT_ID
    ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`
    : 'https://vzlegoryjrgwjwcfoirc.supabase.co');

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const SUPABASE_EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1`;

const getFunctionUrl = (path: string) => {
  if (!SUPABASE_URL) {
    throw new Error('Payment backend URL is missing. Please configure VITE_SUPABASE_URL.');
  }

  return `${SUPABASE_EDGE_FUNCTION_URL}/${path}`;
};

const buildHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (SUPABASE_PUBLISHABLE_KEY) {
    headers.Authorization = `Bearer ${SUPABASE_PUBLISHABLE_KEY}`;
    headers.apikey = SUPABASE_PUBLISHABLE_KEY;
  }

  return headers;
};

const callPaymentFunction = async (
  path: string,
  payload: Record<string, any>
) => {
  let response: Response;
  try {
    response = await fetch(getFunctionUrl(path), {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'network error';
    throw new Error(`Payment service is currently unavailable (${detail}). Please verify Lovable Cloud Functions deployment.`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail = errorData.error || `${response.status} ${response.statusText}`;
    throw new Error(`Payment request failed: ${detail}`);
  }

  return response.json();
};

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface PaymentOptions {
  orderId?: string;
  subscriptionId?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export const initiatePayment = async (options: PaymentOptions) => {
  const res = await loadRazorpayScript();
  if (!res) {
    alert('Razorpay SDK failed to load. Please check your connection.');
    return;
  }

  const rzpOptions: any = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    currency: options.currency || 'INR',
    name: options.name || 'Flood.chat',
    description: options.description || 'Payment',
    handler: function (response: any) {
      options.onSuccess(response);
    },
    prefill: options.prefill || {},
    theme: {
      color: '#2563eb',
    },
    modal: {
      ondismiss: function () {
        options.onError({ message: 'Payment cancelled' });
      },
    },
  };

  if (options.subscriptionId) {
    rzpOptions.subscription_id = options.subscriptionId;
  } else if (options.orderId && options.amount) {
    rzpOptions.order_id = options.orderId;
    rzpOptions.amount = options.amount;
  } else {
    throw new Error('Missing payment configuration.');
  }

  const paymentObject = new window.Razorpay(rzpOptions);
  paymentObject.open();
};

export const createActivationOrder = async (userId: string, offerConfig?: any) => {
  const data = await callPaymentFunction('create-activation-order', {
    userId,
    offerConfig,
  });

  return new Promise((resolve, reject) => {
    initiatePayment({
      orderId: data.orderId,
      amount: data.amount,
      description: 'Account Activation - ₹10',
      onSuccess: (response) => {
        resolve(response);
      },
      onError: (error) => {
        reject(error);
      },
    });
  });
};

export const createSubscriptionOrder = async (
  userId: string,
  plan: 'starter' | 'growth' | 'addon_bot',
  billingPeriod: 'monthly' | 'annual' = 'monthly'
) => {
  const data = await callPaymentFunction('create-subscription', {
    userId,
    plan,
    billingPeriod,
  });

  return new Promise((resolve, reject) => {
    initiatePayment({
      subscriptionId: data.subscriptionId,
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} ${billingPeriod === 'annual' ? 'Yearly' : 'Monthly'} Subscription`,
      name: plan === 'addon_bot' ? 'Extra Bot Slot' : 'Flood.chat',
      onSuccess: (response) => {
        resolve(response);
      },
      onError: (error) => {
        reject(error);
      },
    });
  });
};

