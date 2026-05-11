# Payment Integration - Bolt Cloud Functions + Razorpay

## Overview

Your BotForge SaaS platform now uses **Bolt Cloud Functions** for all payment processing with Razorpay integration. Firebase is used exclusively for database operations.

## Architecture

```
Frontend (React) → Bolt Cloud Functions → Razorpay → Webhook → Firebase Database
```

## Configuration

### Cloud Function Endpoint
```
https://asia-south1-chatbotsaas-2eb6e.cloudfunctions.net
```

### Razorpay Credentials
- **Key ID**: `rzp_live_SS6O77lbDARpNo` (configured in `.env`)
- **Key Secret**: `OZlKSqr7Uga9wb9kdk5OCf4o` (server-side only)
- **Webhook Secret**: `fzu_r2SW2BhW6_4` (for webhook verification)

### Razorpay Plans
The following subscription plans are configured:

**Monthly Subscriptions:**
- Starter Plan: `plan_SS6ToZli7yfqvj` (₹99/month)
- Growth Plan: `plan_SS6aSjNa1uXu1i` (₹699/month)

**Addons (Starter Plan):**
- Extra Bot Addon: `plan_SSFCSuJtle9XOP` (₹49/month)
- AI Bot Addon: `plan_SSFDlca4cjG6QA` (₹99/month)

**Addons (Growth Plan):**
- Extra Bot Addon: `plan_SSFD1vwJW36U1b` (₹49/month)
- AI Bot Addon: `plan_SSFEKT9YfYEyeI` (₹99/month)

## Payment Flow Functions

### 1. Activation Payment (₹10)
**Endpoint**: `/createActivationOrder`

Triggered when a new user activates their account. Grants 7-day trial access.

```typescript
// Frontend usage
import { createActivationOrder } from './lib/razorpay';

await createActivationOrder(userId, offerConfig);
```

**Expected Response:**
```json
{
  "orderId": "order_xxx",
  "amount": 1000
}
```

### 2. Subscription Creation
**Endpoint**: `/createSubscription`

Creates a recurring subscription for Starter or Growth plans.

```typescript
await createSubscriptionOrder(userId, 'starter');
// or
await createSubscriptionOrder(userId, 'growth');
```

**Expected Response:**
```json
{
  "subscriptionId": "sub_xxx",
  "amount": 9900
}
```

### 3. Lead Unlock (₹19)
**Endpoint**: `/createLeadUnlockOrder`

Unlocks a single lead for free plan users who have exceeded 30 leads.

```typescript
await createLeadUnlockOrder(userId, leadId);
```

**Expected Response:**
```json
{
  "orderId": "order_xxx",
  "amount": 1900
}
```

### 4. Addon Purchase
**Endpoint**: `/createAddonOrder`

Purchases additional bot or AI bot addons. Plan-specific pricing.

```typescript
await createAddonOrder(userId, 'bot', userPlan);
// or
await createAddonOrder(userId, 'ai_bot', userPlan);
```

**Request Body:**
```json
{
  "userId": "user_xxx",
  "addonType": "bot",
  "userPlan": "starter"
}
```

**Expected Response:**
```json
{
  "orderId": "order_xxx",
  "amount": 4900
}
```

## Webhook Integration

### Webhook URL
```
https://asia-south1-chatbotsaas-2eb6e.cloudfunctions.net/razorpayWebhook
```

### Webhook Events to Subscribe
Configure in Razorpay Dashboard:
- `payment.authorized`
- `payment.captured`
- `payment.failed`
- `subscription.activated`
- `subscription.charged`
- `subscription.cancelled`
- `subscription.paused`
- `subscription.resumed`
- `order.paid`

### Webhook Verification
All webhooks are verified using the secret: `fzu_r2SW2BhW6_4`

## Database Updates

After successful payment, the cloud function should update Firebase:

### User Document (`users` collection)
```javascript
{
  plan: 'starter' | 'growth',
  activated: true,
  trialEndsAt: Timestamp,
  subscriptionId: 'sub_xxx',
  subscriptionStatus: 'active',
  addons: {
    bot: 2,
    ai_bot: 1
  }
}
```

### Payment Record (`payments` collection)
```javascript
{
  userId: 'user_xxx',
  orderId: 'order_xxx',
  amount: 1000,
  currency: 'INR',
  status: 'success',
  type: 'activation' | 'subscription' | 'lead_unlock' | 'addon',
  razorpayPaymentId: 'pay_xxx',
  createdAt: Timestamp
}
```

## Frontend Implementation

### Payment Initialization Flow

1. User clicks payment button
2. Frontend calls appropriate function (e.g., `createActivationOrder`)
3. Cloud function creates Razorpay order
4. Razorpay checkout opens in browser
5. User completes payment
6. Razorpay sends webhook to cloud function
7. Cloud function updates Firebase database
8. Frontend reloads user data and shows success

### Error Handling

All payment functions include try-catch blocks:

```typescript
try {
  await createSubscriptionOrder(userId, 'starter');
  // Success - data auto-updated via webhook
} catch (error) {
  console.error('Payment failed:', error);
  alert('Payment failed. Please try again.');
}
```

## Testing

### Test Mode
For testing, replace in cloud function:
- Use Razorpay test API keys
- Use test mode plan IDs from Razorpay dashboard

### Test Cards
Use Razorpay test cards:
- Success: 4111 1111 1111 1111
- Failure: 4000 0000 0000 0002

## Security

1. **API Keys**: Live key ID exposed to frontend (safe), secret key server-side only
2. **Webhook Verification**: All webhooks verified with secret
3. **User Validation**: Cloud functions validate userId before creating orders
4. **Amount Verification**: Server-side amount calculation prevents tampering

## Deployment Checklist

- [x] Razorpay live keys configured
- [x] Cloud function endpoint updated in code
- [x] Webhook URL configured in Razorpay dashboard
- [x] All plan IDs configured correctly
- [ ] Test activation payment flow
- [ ] Test subscription purchase
- [ ] Test addon purchase
- [ ] Test lead unlock
- [ ] Verify webhook updates Firebase correctly

## Support

For payment issues:
1. Check Razorpay dashboard for transaction status
2. Verify webhook delivery in Razorpay logs
3. Check Firebase `payments` collection for records
4. Review cloud function logs for errors

---

**Status**: Configured ✅
**Live Mode**: Active 🔴
**Build**: Passing ✅
