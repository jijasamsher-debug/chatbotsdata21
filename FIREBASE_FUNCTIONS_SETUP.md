# Firebase Cloud Functions Setup Guide

This document contains all the Cloud Functions needed for the BotForge SaaS platform.

## Setup Instructions

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

2. Install dependencies in functions folder:
```bash
cd functions
npm install razorpay
npm install --save-dev @types/razorpay
```

3. Set environment variables:
```bash
firebase functions:config:set razorpay.key_id="YOUR_KEY_ID"
firebase functions:config:set razorpay.key_secret="YOUR_KEY_SECRET"
firebase functions:config:set razorpay.webhook_secret="YOUR_WEBHOOK_SECRET"
```

4. Deploy functions:
```bash
firebase deploy --only functions
```

## Required Cloud Functions

All functions should be added to `functions/src/index.ts`

### 1. createActivationOrder
Creates a Razorpay Order for ₹10 activation fee.

### 2. createSubscription
Creates a Razorpay Subscription after trial ends.

### 3. createLeadUnlockOrder
Creates a Razorpay Order for ₹19 to unlock a single lead.

### 4. createAddonOrder
Creates addon subscription for extra bots or AI bots.

### 5. razorpayWebhook
Handles all Razorpay webhook events (payment.captured, subscription.charged, etc.).

### 6. checkExpiredTrials (Scheduled)
Runs daily to deactivate bots for users whose trial has expired.

## See CLOUD_FUNCTIONS.ts for complete implementation code.
