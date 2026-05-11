import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const trackAffiliateReferral = (code?: string) => {
  if (!code) {
    const urlParams = new URLSearchParams(window.location.search);
    code = urlParams.get('ref') || undefined;

    if (!code) {
      const pathParts = window.location.pathname.split('/');
      const refIndex = pathParts.indexOf('ref');
      if (refIndex !== -1 && pathParts[refIndex + 1]) {
        code = pathParts[refIndex + 1];
      }
    }
  }

  if (code) {
    localStorage.setItem('affiliateReferralCode', code);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    localStorage.setItem('affiliateReferralExpiry', expiryDate.toISOString());
  }
};

export const getAffiliateReferralCode = (): string | null => {
  const code = localStorage.getItem('affiliateReferralCode');
  const expiry = localStorage.getItem('affiliateReferralExpiry');

  if (!code || !expiry) {
    return null;
  }

  if (new Date(expiry) < new Date()) {
    clearAffiliateReferral();
    return null;
  }

  return code;
};

export const clearAffiliateReferral = () => {
  localStorage.removeItem('affiliateReferralCode');
  localStorage.removeItem('affiliateReferralExpiry');
};

export const recordAffiliateSignup = async (userEmail: string, userId: string) => {
  const referralCode = getAffiliateReferralCode();

  if (!referralCode) {
    return;
  }

  try {
    const affiliatesQuery = query(
      collection(db, 'affiliates'),
      where('affiliateCode', '==', referralCode),
      where('isActive', '==', true)
    );
    const affiliatesSnapshot = await getDocs(affiliatesQuery);

    if (affiliatesSnapshot.empty) {
      console.log('Affiliate code not found or inactive');
      clearAffiliateReferral();
      return;
    }

    const affiliateDoc = affiliatesSnapshot.docs[0];
    const affiliateId = affiliateDoc.id;

    await addDoc(collection(db, 'affiliateReferrals'), {
      affiliateId: affiliateId,
      referredUserEmail: userEmail,
      referredUserId: userId,
      status: 'signed_up',
      commissionEarned: 0,
      commissionPaid: false,
      visitDate: Timestamp.now(),
      signupDate: Timestamp.now()
    });

    await updateDoc(doc(db, 'affiliates', affiliateId), {
      totalReferrals: increment(1)
    });

    clearAffiliateReferral();
    console.log('Affiliate referral recorded successfully');
  } catch (error) {
    console.error('Error recording affiliate signup:', error);
  }
};

export const recordAffiliateSubscription = async (
  userId: string,
  plan: string,
  amount: number
) => {
  // Only track commissions for subscription plans, not addons
  const commissionEligiblePlans = ['starter', 'starter_yearly', 'growth', 'growth_yearly'];
  if (!commissionEligiblePlans.includes(plan.toLowerCase())) {
    console.log(`Skipping commission tracking for non-plan purchase: ${plan}`);
    return;
  }

  try {
    const referralsQuery = query(
      collection(db, 'affiliateReferrals'),
      where('referredUserId', '==', userId)
    );
    const referralsSnapshot = await getDocs(referralsQuery);

    if (referralsSnapshot.empty) {
      console.log('No affiliate referral found for user:', userId);
      return;
    }

    const referralDoc = referralsSnapshot.docs[0];
    const referralData = referralDoc.data();

    const affiliateId = referralData.affiliateId;

    const affiliateDocRef = doc(db, 'affiliates', affiliateId);
    const affiliateSnapshot = await getDocs(
      query(collection(db, 'affiliates'), where('__name__', '==', affiliateId))
    );

    if (affiliateSnapshot.empty) {
      console.log('Affiliate not found:', affiliateId);
      return;
    }

    const affiliate = affiliateSnapshot.docs[0].data();
    const hasLifetimeCommissions = affiliate.lifetimeCommissions === true;

    // Block repeat commissions unless lifetime commissions is enabled
    if (referralData.status === 'subscribed' && !hasLifetimeCommissions) {
      console.log('Affiliate subscription commission already recorded for user:', userId);
      return;
    }

    const commissionRate = affiliate.commissionRate || 20;
    const commissionEarned = (amount * commissionRate) / 100;

    await updateDoc(doc(db, 'affiliateReferrals', referralDoc.id), {
      status: 'subscribed',
      subscriptionPlan: plan,
      subscriptionAmount: amount,
      commissionEarned: increment(commissionEarned),
      subscriptionDate: Timestamp.now()
    });

    await updateDoc(affiliateDocRef, {
      totalEarnings: increment(commissionEarned),
      pendingBalance: increment(commissionEarned)
    });

    await addDoc(collection(db, 'affiliateCommissions'), {
      affiliateId: affiliateId,
      userId: userId,
      plan: plan,
      amount: amount,
      commission: commissionEarned,
      commissionRate: commissionRate,
      status: 'pending',
      isRecurring: referralData.status === 'subscribed',
      createdAt: Timestamp.now()
    });

    console.log(`Affiliate commission recorded: $${commissionEarned.toFixed(2)} for ${plan} (${commissionRate}% of $${amount})${hasLifetimeCommissions ? ' [lifetime]' : ''}`);
  } catch (error) {
    console.error('Error recording affiliate subscription:', error);
  }
};
