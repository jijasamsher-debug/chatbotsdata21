export type UserRole = 'user' | 'admin';

export interface User {
  uid: string;
  email: string;
  name: string;
  displayName?: string;
  role: UserRole;
  plan?: 'free' | 'starter' | 'growth' | 'starter_yearly' | 'growth_yearly';
  createdAt: Date;
  activated: boolean;
  activatedAt?: Date;
  trialActive: boolean;
  trialStartAt?: Date;
  trialEndsAt: Date;
  freeLeadVisibleUntil?: Date;
  totalLeadsCount?: number;
  trialDurationDays?: number;
  planAfterTrial?: 'starter' | 'growth';
  removePoweredBy?: boolean;
  referredBy?: string;
  geminiApiKey?: string;
  botLimit?: number;
  aiBotLimit?: number;
  subscriptionId?: string;
  subscription?: {
    plan: 'free' | 'starter' | 'growth' | 'starter_yearly' | 'growth_yearly';
    status: 'active' | 'failed' | 'cancelled' | 'trial';
    razorpaySubscriptionId?: string;
    razorpayCustomerId?: string;
    nextBillingDate?: Date;
    amount?: number;
    paymentLink?: string;
    billingPeriod?: 'monthly' | 'yearly';
    addons?: {
      extraBots?: number;
      aiBots?: number;
    };
  };
  payoutMinimum?: number;
}

export type BotType = 'leads' | 'smart';

export interface FollowUpCta {
  id: string;
  text: string;
  url: string;
}

export interface FollowUpMessage {
  id: string;
  text: string;
  gifUrl?: string;
  ctas?: FollowUpCta[];
}

export interface Question {
  id: string;
  text: string;
  columnHeader?: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'multiselect' | 'date' | 'qualify';
  options?: string[];
  required: boolean;
  /** Optional image shown with the question prompt in the widget. */
  imageUrl?: string;
  followUpMessages?: FollowUpMessage[];
  /** Per-option follow-up messages for select/multiselect/qualify questions. Sent in addition to followUpMessages. */
  optionFollowUps?: Record<string, FollowUpMessage[]>;
}

export interface PageRule {
  id: string;
  urlPattern: string;
  welcomeMessage?: string;
  popupMessage?: string;
  questions?: Question[];
  customThankYouMessage?: string;
  thankYouGifUrl?: string;
  thankYouCtaText?: string;
  thankYouCtaUrl?: string;
  thankYouCtas?: ThankYouCta[];
}

export type WidgetTemplate = 'standard' | 'modernui';

export interface ThankYouCta {
  id: string;
  text: string;
  url: string;
}

export interface BotTheme {
  primaryColor: string;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  template?: WidgetTemplate;
  logoUrl?: string;
  botAvatarUrl?: string;
  botName?: string;
  botSubtitle?: string;
  ctaMessage?: string;
  ctaText?: string;
  thankYouMessage?: string;
  thankYouGifUrl?: string;
  thankYouCtaText?: string;
  thankYouCtaUrl?: string;
  thankYouCtas?: ThankYouCta[];
  removePoweredBy?: boolean;
  autoOpenDelay?: number;
  typingSpeed?: number;
  popupAnimation?: 'bounce' | 'fade' | 'slide' | 'none';
  widgetAnimation?: 'fade' | 'slide' | 'scale' | 'none';
}

export interface BotConfig {
  theme: BotTheme;
  welcomeMessage: string;
  welcomeGifUrl?: string;
  popupMessage: string;
  popupGifUrl?: string;
  popupDelay: number;
  questions: Question[];
  pageRules: PageRule[];
  knowledgeBaseId?: string;
  collectLeadsFirst: boolean;
  leadsTableName?: string;
}

export interface Bot {
  id: string;
  ownerId: string;
  name: string;
  type: BotType;
  createdAt: Date;
  config: BotConfig;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

export interface KnowledgeBase {
  id: string;
  ownerId: string;
  name: string;
  articles: Article[];
}

export interface Lead {
  id: string;
  botId: string;
  ownerId: string;
  collectedAt: Date;
  pageUrl: string;
  answers: Record<string, string>;
  sessionId: string;
  unlocked?: boolean;
}

export interface AdminSettings {
  geminiApiKey: string;
  trialDurationDays: number;
  globalPayoutMinimum?: number;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'activation' | 'subscription' | 'addon';
  plan?: 'starter' | 'growth' | 'starter_yearly' | 'growth_yearly';
  addonType?: 'bot' | 'ai_bot';
  amount?: number;
  billingPeriod?: 'monthly' | 'yearly';
  status: 'pending' | 'payment_link_sent' | 'paid' | 'rejected';
  paymentLink?: string;
  isRecurring?: boolean;
  transactionId?: string;
  notes?: string;
  expiryDate?: Date;
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string;
  userMarkedPaidAt?: Date;
  userTransactionId?: string;
  userNotes?: string;
}

export interface Payment {
  id: string;
  userId: string;
  type: 'activation' | 'subscription' | 'addon';
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySubscriptionId?: string;
  amount: number;
  status: 'pending' | 'captured' | 'failed';
  createdAt: Date;
  metadata?: {
    leadId?: string;
    botId?: string;
    planId?: string;
    addonType?: string;
  };
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImageUrl?: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
  categories: string[];
  tags: string[];
  status: 'draft' | 'published';
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LandingPageSection {
  id: string;
  type: 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta' | 'faq';
  data: any;
}

export interface LandingPage {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  offerConfig: {
    trialDays: number;
    planAfterTrial: 'starter' | 'growth';
    activationFee: number;
    affiliateId?: string;
  };
  sections: LandingPageSection[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateApplication {
  id: string;
  name: string;
  email: string;
  websiteUrl: string;
  promotionPlan: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface Affiliate {
  id: string;
  userId: string;
  name: string;
  email: string;
  affiliateCode: string;
  commissionPercent: number;
  pendingBalance: number;
  totalEarned: number;
  totalPaid: number;
  payoutMinimum?: number;
  lifetimeCommissions?: boolean;
  status: 'active' | 'suspended';
  createdAt: Date;
}

export interface AffiliateCommission {
  id: string;
  affiliateId: string;
  userId: string;
  paymentId: string;
  amount: number;
  commission: number;
  createdAt: Date;
}

export interface AffiliatePayoutRequest {
  id: string;
  affiliateId: string;
  amount: number;
  status: 'pending' | 'paid';
  requestedAt: Date;
  paidAt?: Date;
}

export interface AffiliateResource {
  id: string;
  type: 'banner' | 'landingPage';
  name: string;
  imageUrl?: string;
  linkUrl: string;
  dimensions?: string;
  assignedTo: 'all' | string[];
  createdAt: Date;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}
