# BotForge Setup Guide

## Initial Setup Steps

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable **Firestore Database**
   - Create database in production mode
   - Choose a location
4. Enable **Authentication**
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google (optional)
5. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Copy the config values to your `.env` file

### 2. Environment Configuration

Update your `.env` file with Firebase credentials (already done if you followed the README).

### 3. Create First Admin User

After deploying your app:

1. Sign up for an account through the login page
2. Go to Firebase Console > Firestore Database
3. Find your user document in the `users` collection
4. Click on the document
5. Click "Edit field" on the `role` field
6. Change the value from `"user"` to `"admin"`
7. Save the changes
8. Refresh your application and you'll now have admin access

### 4. Configure Global Settings

As an admin:

1. Go to Admin Panel > Global Settings tab
2. Add your Gemini API key (optional - for fallback)
   - Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Set trial duration (default is 14 days)
4. Save settings

### 5. Test the Application

#### Create a Test Bot

1. Go to Dashboard > Bots > Create Bot
2. Choose "Leads Generator" for a simple test
3. Configure the bot through all 7 steps:
   - **Step 1**: Choose "Leads Generator"
   - **Step 2**: Name: "Test Support Bot", set welcome message
   - **Step 3**: Add 2-3 questions (name, email, message)
   - **Step 4**: Customize theme colors
   - **Step 5**: Add page rules (optional)
   - **Step 6**: Skip knowledge base (for Leads Generator)
   - **Step 7**: Copy the embed code
4. **IMPORTANT**: Click "Create Bot" on Step 7 to save
5. The bot will now appear in your dashboard

#### Test the Widget

1. Create a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
</head>
<body>
  <h1>Test Page</h1>

  <!-- Paste your embed code here -->
  <iframe
    src="http://localhost:5173/widget/your-bot-id"
    style="position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 999999;"
  ></iframe>
</body>
</html>
```

2. Open this HTML file in a browser
3. The chatbot should appear in the bottom-right corner
4. Complete a conversation
5. Check Dashboard > Leads to see the collected data

#### Test Smart AI Bot (Optional)

1. Create a new bot, choose "Smart AI"
2. Create a knowledge base with a few articles about your product/service
3. Link the knowledge base to your bot
4. Admin should assign a Gemini API key (or set global key)
5. Test the widget - it should answer questions using your knowledge base

### 6. Firestore Security Rules

Don't forget to set up security rules in Firebase Console > Firestore Database > Rules:

(See the rules in README.md)

### 7. Deploy to Production

#### Option A: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

#### Option B: Vercel

```bash
npm install -g vercel
vercel
```

#### Option C: Netlify

```bash
npm install -g netlify-cli
npm run build
netlify deploy
```

## Common Issues

### Issue: Bot not appearing in dashboard

**Solution**:
- Bots only appear after completing all 7 steps and clicking "Create Bot" on Step 7
- If you navigated away mid-creation, the bot was not saved
- Start a new bot creation and complete all steps

### Issue: "Bot is currently paused"

**Solution**:
- Check that user's trial is active
- Admin can toggle trial status in Admin Panel > Users tab
- Or upgrade to a paid plan (Phase 2)

### Issue: AI responses not working

**Solution**:
- Verify Gemini API key is set (either user-specific or global)
- Check API key is valid at [Google AI Studio](https://makersuite.google.com/)
- Check browser console for API errors

### Issue: Widget not appearing

**Solution**:
- Check that bot ID in embed code matches actual bot ID
- Verify trial/subscription is active
- Check browser console for errors
- Ensure iframe URL is correct

### Issue: Leads not saving

**Solution**:
- Check Firestore security rules allow writes to `leads` collection
- Check browser console for permission errors
- Verify bot configuration is saved correctly

## Tips for Production

1. **Security**:
   - Never commit `.env` file to version control
   - Use environment variables for all sensitive data
   - Review and tighten Firestore security rules

2. **Performance**:
   - Enable Firestore indexes for common queries
   - Consider adding Firebase Cloud Functions for complex operations
   - Implement rate limiting for widget requests

3. **Monitoring**:
   - Set up Firebase Analytics
   - Monitor Firestore usage and quotas
   - Track API key usage (Gemini)

4. **Backups**:
   - Enable automatic Firestore backups
   - Export lead data regularly
   - Keep copies of knowledge base articles

## Next Steps

1. Customize the theme and branding
2. Add more question types to bot builder
3. Integrate Razorpay for subscriptions (Phase 2)
4. Set up email notifications for new leads
5. Add analytics and reporting features

## Support

For issues or questions:
- Check the README.md
- Review Firebase Console logs
- Check browser console for errors
- Verify all environment variables are set correctly
