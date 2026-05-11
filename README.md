# BotForge - SaaS Chat Widget Platform

A full-stack SaaS application that lets users create embeddable chatbots for their websites. Built with React, TypeScript, Firebase, and Tailwind CSS.

## Features

### Bot Types

1. **Leads Generator**
   - Conversational form-based chatbot
   - Collects visitor information through custom questions
   - Typewriter effect and chat bubble UI
   - Customizable questions (text, email, phone, dropdown)

2. **Smart AI**
   - Powered by Google Gemini API
   - Uses knowledge base articles as context
   - Optional lead collection before AI chat
   - Intelligent responses to customer questions

### Core Functionality

- **Bot Builder**: 7-step wizard with live preview
  1. Choose Type (Leads Generator or Smart AI)
  2. General Settings (name, welcome message, popup settings)
  3. Questions Configuration (drag-and-drop, multiple types)
  4. Theme & Design (colors, fonts)
  5. Page Rules (dynamic behavior per URL)
  6. Knowledge Base (for Smart AI bots)
  7. Embed Code (iframe or script tag)

- **Knowledge Base Management**
  - Create and organize articles
  - Tag-based organization
  - Used as context for Smart AI responses

- **Lead Management**
  - View all collected leads
  - Export to CSV
  - Detailed lead information
  - Filter and search capabilities

- **Admin Panel** (Role-based access)
  - User management (trial status, API key assignment)
  - Global settings (fallback API key, trial duration)
  - All leads view across users
  - Subscription management (Razorpay-ready)

### User Roles

- **Regular User**
  - Create and manage bots
  - Free trial with auto-expiry
  - View their own leads
  - Get embed codes

- **Admin**
  - All regular user features
  - Manage all users
  - Assign Gemini API keys per user
  - Set global fallback API key
  - View all leads across platform

### Gemini API Key Management

- Admin assigns API keys per user
- Global fallback key for users without assigned key
- Users never see or manage API keys
- Automatic key resolution at runtime

### Trial & Subscription Logic

- Automatic trial activation on signup
- Trial duration configurable by admin
- Dashboard banner shows remaining trial days
- Widget pauses when trial expires
- Razorpay integration ready (Phase 2)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Auth)
- **AI**: Google Gemini API
- **Icons**: Lucide React
- **Payment**: Razorpay (stub - ready for Phase 2)

## Project Structure

```
src/
├── components/
│   ├── bot-builder/         # Bot builder wizard steps
│   ├── AdminRoute.tsx       # Admin route guard
│   ├── DashboardLayout.tsx  # Dashboard layout with sidebar
│   └── ProtectedRoute.tsx   # Auth route guard
├── contexts/
│   └── AuthContext.tsx      # Authentication context
├── lib/
│   └── firebase.ts          # Firebase configuration
├── pages/
│   ├── Admin.tsx            # Admin panel
│   ├── BotBuilder.tsx       # Bot creation/editing
│   ├── BotsList.tsx         # User's bots list
│   ├── Dashboard.tsx        # Dashboard home
│   ├── KnowledgeBase.tsx    # Knowledge base manager
│   ├── Leads.tsx            # Leads view
│   ├── Login.tsx            # Login/signup
│   ├── Upgrade.tsx          # Subscription plans
│   └── Widget.tsx           # Embeddable widget (public)
├── types/
│   └── index.ts             # TypeScript types
└── App.tsx                  # Main app with routes
```

## Routes

- `/login` - Sign in / Sign up
- `/dashboard` - User home (bots and leads summary)
- `/dashboard/bots` - List of bots
- `/dashboard/bots/new` - Create new bot
- `/dashboard/bots/:botId` - Edit bot
- `/dashboard/leads` - View collected leads
- `/dashboard/knowledge` - Manage knowledge bases
- `/dashboard/upgrade` - Subscription plans
- `/admin` - Admin panel (protected)
- `/widget/:botId` - Embeddable widget (public)

## Firestore Data Structure

### Collections

**users/{uid}**
- email, name, role, createdAt
- trialActive, trialEndsAt
- geminiApiKey (admin-managed)
- subscription: { plan, status, razorpayCustomerId }

**bots/{botId}**
- ownerId, name, type, createdAt
- config: { theme, welcomeMessage, popupMessage, popupDelay, questions, pageRules, knowledgeBaseId, collectLeadsFirst }

**knowledgeBases/{kbId}**
- ownerId, name
- articles: [{ id, title, content, tags }]

**leads/{leadId}**
- botId, ownerId, collectedAt, pageUrl, answers, sessionId

**adminSettings/global**
- geminiApiKey (fallback)
- trialDurationDays

## Environment Variables

Create a `.env` file with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Firebase:
   - Create a Firebase project
   - Enable Firestore and Authentication
   - Update `.env` with your credentials

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Firebase Setup

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId ||
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /bots/{botId} {
      allow read: if true;
      allow write: if request.auth != null &&
                     (resource.data.ownerId == request.auth.uid ||
                      !exists(/databases/$(database)/documents/bots/$(botId)));
    }

    match /knowledgeBases/{kbId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     (resource.data.ownerId == request.auth.uid ||
                      !exists(/databases/$(database)/documents/knowledgeBases/$(kbId)));
    }

    match /leads/{leadId} {
      allow read: if request.auth != null &&
                    (resource.data.ownerId == request.auth.uid ||
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if true;
    }

    match /adminSettings/{doc} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Authentication

Enable these sign-in methods in Firebase Console:
- Email/Password
- Google

## Widget Embedding

Users can embed the chatbot on their website using either method:

### Option 1: IFrame (Recommended)

```html
<iframe
  src="https://yourdomain.com/widget/bot_123"
  style="position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 999999;"
></iframe>
```

### Option 2: Script Tag

```html
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = 'https://yourdomain.com/widget/bot_123';
    iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:999999;';
    document.body.appendChild(iframe);
  })();
</script>
```

## Future Enhancements (Phase 2)

- [ ] Razorpay payment integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Webhook integrations
- [ ] WhatsApp/Telegram bot deployment
- [ ] A/B testing for bot configurations
- [ ] Conversation exports
- [ ] Team collaboration features

## License

Private project - All rights reserved
