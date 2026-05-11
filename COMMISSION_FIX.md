# Payment and Commission Tracking Fixes

## Issues Fixed

### 1. Undefined Metadata Error in Payment Creation
**Problem:** When creating payment records in Firebase, the metadata object contained undefined values for fields like `addonType`, causing Firestore errors.

**Solution:** Modified `PaymentManagement.tsx` (lines 187-205) to:
- Build metadata object conditionally, only adding fields that have values
- Prevents undefined values from being written to Firestore
- Ensures clean payment records

### 2. Missing Commission Tracking for Addon Payments
**Problem:** Commissions were only being tracked for subscription payments, not for addon purchases.

**Solution:** Updated `PaymentManagement.tsx` to track commissions for addon payments:
- Added commission tracking for bot addons (mapped to 'addon_bot')
- Added commission tracking for AI bot addons (mapped to 'addon_ai_bot')
- Ensures affiliates earn commissions on all payment types

### 3. Incomplete Commission Records
**Problem:** The `recordAffiliateSubscription` function only updated referral records and affiliate balances, but didn't create actual commission records in the `affiliateCommissions` collection.

**Solution:** Updated `affiliateTracking.ts` to:
- Create commission records in `affiliateCommissions` collection with all details
- Track commission rate, amount, and status
- Provides complete audit trail for all commissions
- Added detailed logging for debugging

### 4. Missing Addon Prices
**Problem:** The `getPlanAmount` function didn't have prices for addon payments.

**Solution:** Added addon prices to `affiliateCommissions.ts`:
- `addon_bot`: ₹490
- `addon_ai_bot`: ₹990

## How Commission Tracking Works Now

### Manual Payment Flow (Admin Confirms Payment)
1. User requests payment via payment request system
2. Admin sends payment link or processes manually
3. Admin confirms payment in PaymentManagement page
4. System creates payment record with proper metadata
5. For subscriptions: `trackSubscriptionCommission` is called
6. For addons: `trackSubscriptionCommission` is called with addon type
7. Commission record is created with:
   - Affiliate ID
   - User ID
   - Plan/addon type
   - Payment amount
   - Commission amount (based on rate)
   - Status: 'pending'
8. Affiliate balances are updated:
   - `totalEarnings` incremented
   - `pendingBalance` incremented
9. Referral record updated with commission details

### Automated Payment Flow (Razorpay)
Note: The Razorpay webhook handler (CLOUD_FUNCTIONS.ts) already handles commission tracking for automated payments.

## Payment Types Supported

1. **Subscriptions** (starter, growth, pro, enterprise)
   - Commission tracked on initial payment
   - Commission tracked on recurring payments (via webhook)

2. **Addons** (bot, ai_bot)
   - Commission tracked when admin confirms payment
   - Uses special plan codes: 'addon_bot', 'addon_ai_bot'

3. **Activation** (account activation)
   - Small ₹10 fee for account activation
   - Currently does not track commissions (too small)

4. **Lead Unlock** (unlock lead details)
   - ₹19 per lead unlock
   - Currently does not track commissions (one-time small fee)

## Testing Commission Flow

To verify commissions are working:

1. Check `affiliateReferrals` collection:
   - Should have record linking user to affiliate
   - Status should update to 'subscribed' after payment
   - `commissionEarned` should show calculated amount

2. Check `affiliateCommissions` collection:
   - Should have individual commission record for each payment
   - Contains all payment and commission details

3. Check `affiliates` collection:
   - `totalEarnings` should increase with each commission
   - `pendingBalance` should increase (until payout processed)

## Commission Rates

Default commission rate: **20%**

This can be customized per affiliate in the `affiliates` collection by setting the `commissionRate` field.

## Future Improvements

1. Add commission tracking for activation payments (if needed)
2. Add commission tracking for lead unlock (if needed)
3. Implement recurring commission tracking for subscription renewals
4. Add webhook endpoint to handle Razorpay payment confirmations automatically
5. Create admin dashboard to view commission analytics
