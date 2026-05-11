# User Payment Self-Reporting Feature

## Overview

Users can now mark their payments as "paid" after completing payment through the provided link. This streamlines the payment verification process and reduces manual follow-up.

## How It Works

### For Users:

1. **Request a Plan/Addon**
   - User submits a payment request for a subscription or addon
   - Request goes into "Pending" status

2. **Receive Payment Link**
   - Admin reviews and sends a payment link
   - User sees the payment link in a banner on their dashboard
   - Payment request status changes to "Payment Link Sent"

3. **Complete Payment**
   - User clicks "Pay Now" button
   - Opens payment gateway in new tab
   - User completes payment via the payment link

4. **Report Payment**
   - User returns to the dashboard
   - Clicks "I Have Paid" button
   - Enters their transaction ID/reference number
   - System saves the transaction ID and timestamp

5. **Admin Verification**
   - Admin sees user's reported payment with transaction ID
   - Admin verifies the payment
   - Admin clicks "Confirm & Activate"
   - Subscription is activated immediately

### For Recurring Payments:

If the payment link is marked as "recurring":
- User can save the link for future renewals
- When subscription expires, user can:
  - Click the same payment link
  - Complete payment
  - Report payment with transaction ID
  - Admin activates the renewal

## User Interface

### Payment Request Banner

The banner appears on user's dashboard and shows:

**Pending State:**
- Yellow banner with clock icon
- "Pending Admin Review" status
- Message: "Your request is being reviewed"

**Payment Link Sent State:**
- Blue banner with credit card icon
- "Payment Link Sent" status
- "Pay Now" button (opens payment gateway)
- "I Have Paid" button (to report payment)
- Instructions for completing payment
- Recurring badge (if applicable)

**Banner Features:**
- Show/Hide Details toggle
- Plan/addon information
- Billing period (monthly/yearly)
- Request date
- Expiry date (if set)

## Admin Interface

### Payment Management - Pending Tab

Shows user-reported payments with:

**Visual Indicators:**
- Green box with checkmark icon
- "User Reported Payment" label
- Transaction ID provided by user
- Timestamp when user reported payment

**Actions:**
- Transaction ID is pre-filled in confirmation modal
- Admin can verify and confirm immediately
- Green notification shows user's report details

### Confirm Payment Modal

Enhanced with:
- Green alert box if user reported payment
- Shows when user reported payment
- Transaction ID pre-filled from user's report
- Message: "Transaction ID has been pre-filled from user's report"

## Database Schema

### paymentRequests Collection

New fields added:
```typescript
{
  userMarkedPaidAt?: Date,        // When user clicked "I Have Paid"
  userTransactionId?: string,     // Transaction ID provided by user
  userNotes?: string             // Auto-generated note about user action
}
```

## Benefits

### For Users:
- Self-service payment reporting
- Faster subscription activation
- Clear payment status tracking
- Save recurring links for renewals
- No need to email transaction IDs

### For Admins:
- Transaction IDs automatically captured
- Clear visual indicator of user payments
- Pre-filled transaction ID in confirm modal
- Reduced back-and-forth communication
- Better audit trail

### For Business:
- Faster payment processing
- Reduced support tickets
- Better user experience
- Higher conversion rates
- Automated payment tracking

## Flow Examples

### Example 1: New Subscription

1. User requests Starter Monthly plan
2. Admin sends payment link (recurring)
3. User clicks "Pay Now", pays ₹999
4. User clicks "I Have Paid", enters TXN123456
5. Admin sees green box with TXN123456
6. Admin clicks Confirm, sets 1 month duration
7. User's subscription activated immediately

### Example 2: Recurring Renewal

1. User's subscription expires
2. User has saved recurring payment link
3. User clicks saved link, pays ₹999
4. User goes to dashboard, sees payment request banner
5. User clicks "I Have Paid", enters TXN789012
6. Admin sees user report, verifies payment
7. Admin confirms, adds 1 more month
8. Subscription renewed

### Example 3: Yearly Plan

1. User requests Growth Yearly plan
2. Admin sends payment link (recurring)
3. User pays ₹25,490
4. User reports payment with TXN456789
5. Admin confirms payment
6. System automatically adds 12 months
7. After 1 year, user uses same link to renew

## Technical Implementation

### Frontend Components:

**PaymentRequestBanner.tsx**
- Real-time subscription to payment requests
- Filters by userId and active statuses
- Handles payment reporting
- Shows payment links and instructions
- Responsive design with mobile support

**PaymentManagement.tsx**
- Shows user-reported payments
- Pre-fills transaction ID
- Visual indicators for user actions
- Admin confirmation workflow

### Backend Operations:

**User Reports Payment:**
```javascript
updateDoc(requestRef, {
  userMarkedPaidAt: serverTimestamp(),
  userTransactionId: transactionId,
  userNotes: 'User completed payment, awaiting admin verification'
});
```

**Admin Confirms:**
- Verifies transaction ID
- Activates subscription
- Updates user's plan
- Creates payment record
- Tracks affiliate commission

## Security Considerations

1. **Transaction ID Validation**
   - Required field, cannot be empty
   - Trimmed for whitespace
   - Stored securely in Firestore

2. **Payment Verification**
   - Admin must manually verify before activation
   - User self-report is not auto-approved
   - Full audit trail maintained

3. **Recurring Links**
   - Stored in user's subscription record
   - Only accessible to authenticated user
   - Can be updated by admin anytime

## Future Enhancements

Potential improvements:
- Automatic payment verification via payment gateway API
- Email notifications when payment is reported
- SMS alerts for admins
- Payment receipt upload
- Payment history dashboard for users
- Automated reminders for expiring subscriptions
- Bulk payment confirmation for admins
