

## Plan: Fix Addon Bot Subscription Flow

### Problem
The `create-subscription` already accepts `addon_bot` and uses `razorpay.subscriptions.create` correctly. But the client-side code in `src/lib/razorpay.ts` has an unnecessary fallback to `create-addon-order` (which still contains old order-based code). The flow should go directly through `create-subscription` for all plans including `addon_bot`.

### Changes

**1. `src/lib/razorpay.ts`** — Simplify `createSubscriptionOrder`:
- Remove the try/catch fallback to `create-addon-order` entirely
- Just call `create-subscription` directly for all plans (`starter`, `growth`, `addon_bot`)
- The function becomes a straightforward call without error-matching fallback logic

**2. `supabase/functions/create-addon-order/index.ts`** — Rewrite to use subscription creation only:
- Remove all the old `createAddon` / order-based code (lines 48-83)
- Keep only the subscription creation path using `getPlanId('addon_bot', 'monthly')` and `razorpay.subscriptions.create`
- Return `{ subscriptionId }` consistently
- This serves as a dedicated endpoint if called directly

### Result
- `addon_bot` purchases go through `create-subscription` (same as starter/growth)
- No more "Failed to create addon order" errors
- `create-addon-order` becomes a clean subscription-based fallback endpoint

