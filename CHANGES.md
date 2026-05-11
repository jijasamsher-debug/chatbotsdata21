# Recent Changes

## Enhanced Question Fields & Validation

### New Features

1. **Custom Column Headers**:
   - Each question now has an optional "Column Header" field
   - Use short names for table columns (e.g., "Email" instead of "What is your email address?")
   - Column headers appear in the leads table
   - Falls back to question text if no column header is specified

2. **Field Validation**:
   - **Email fields**: Must contain valid email format (name@domain.com)
   - **Phone fields**: Must contain only numbers, spaces, dashes, parentheses, and plus signs
   - **Phone fields**: Must have at least 10 digits
   - **Required fields**: Cannot be empty
   - Validation errors show in red banner above input
   - Bot shows error message and waits for correct input

3. **Smart Input Types**:
   - Email questions use email input type
   - Phone questions use tel input type
   - Provides native mobile keyboard support

### How It Works

**Setting Column Headers:**
1. Create/edit a bot
2. In Step 3 (Questions), add your questions
3. For each question, set:
   - Question text: "What is your email address?"
   - Column header: "Email" (optional, short name)
   - Type: Email
   - Required: Yes/No

**Validation:**
- Email: Rejects "john" or "john@gmail" - requires "john@gmail.com"
- Phone: Rejects "abc123" - requires "1234567890" or "(123) 456-7890"
- Bot will not proceed until valid input is provided

### Benefits

✅ **Clean Tables**: Short column headers keep leads table readable
✅ **Data Quality**: Validation ensures you get proper contact info
✅ **User Friendly**: Clear error messages help visitors fix mistakes
✅ **Mobile Optimized**: Correct keyboard appears on mobile devices

## Dynamic Leads Table with Custom Names

### New Feature
The leads table is now fully dynamic and displays columns based on the actual questions configured in each bot.

### Key Features

1. **Custom Table Names**:
   - Users can name their leads table in Step 2 (General Settings)
   - Field: "Leads Table Name" (e.g., "Support Leads", "Contact Form")
   - This name appears as the page title when viewing leads

2. **Dynamic Columns**:
   - Table columns automatically match bot questions
   - Column headers show the exact question text (e.g., "What is your name?", "Your email address")
   - No fixed schema - adapts to any question configuration

3. **Bot Filtering**:
   - Filter leads by specific bot using dropdown menu
   - View all leads combined or leads from a single bot
   - When filtering by bot, only relevant columns appear

4. **Smart CSV Export**:
   - Export filename includes the table name
   - Format: `{table-name}-{date}.csv` (e.g., `Support-Leads-2024-01-15.csv`)
   - CSV includes all question columns as headers

### Benefits

- **Flexible**: Works with any question configuration
- **Clear**: Column names match exactly what users see in the bot
- **Organized**: Filter by bot to see specific lead sources
- **Professional**: Custom table names for different lead types

### Usage

**Setting Table Name:**
1. Create/edit a bot
2. In Step 2 (General Settings)
3. Set "Leads Table Name" (defaults to bot name)
4. Complete bot creation

**Viewing Leads:**
- Page title shows table name or "All Leads"
- Click "Filter by Bot" to view specific bot's leads
- Columns automatically display based on questions
- Export creates a CSV with the table name in filename

## Bot Creation Fix

### Problem
Bots were being saved to Firestore on every step when clicking "Next", causing incomplete bots to appear in the dashboard.

### Solution
**Bots are now only saved when completing all 7 steps:**

1. **New Bots**: Only saved to Firestore when user clicks "Create Bot" on Step 7
2. **Editing Bots**: Can save drafts at any step using the "Save Draft" button
3. **Better UX**: Blue info banner reminds users to complete all steps

### Technical Changes

**Bot Builder** (`src/pages/BotBuilder.tsx`):
- Modified `saveBot()` to only save on step 7
- Added `saveDraft()` function for editing existing bots
- Added "Save Draft" button (only visible when editing)
- Changed final button text: "Create Bot" (new) or "Update Bot" (editing)
- Added info banner for new bot creation

**Data Fetching** (All pages):
- Removed Firestore `orderBy()` queries (avoids index requirements)
- Added client-side filtering to exclude bots without `createdAt`
- Added client-side sorting by date
- Pages affected:
  - `Dashboard.tsx`
  - `BotsList.tsx`
  - `Leads.tsx`
  - `Admin.tsx`

### Benefits

1. **Cleaner Dashboard**: Only completed bots appear in the list
2. **No Firestore Indexes Required**: Client-side sorting works immediately
3. **Better User Experience**: Clear guidance on bot creation flow
4. **Draft Support**: Can save progress when editing existing bots

### Usage

**Creating a New Bot:**
1. Navigate through all 7 steps
2. Click "Create Bot" on Step 7
3. Bot appears in your dashboard

**Editing an Existing Bot:**
1. Edit any step
2. Click "Save Draft" to save progress (optional)
3. Click "Update Bot" on Step 7 to finalize changes

### Database Behavior

- New bots: Created only when step 7 is completed
- Edited bots: Can be updated at any step with "Save Draft"
- All bots must have `createdAt` timestamp to appear in lists
- Incomplete bot data is never saved to Firestore

### User Notification

A blue banner appears at the top of the bot builder for new bots:
> "Complete all 7 steps and click 'Create Bot' to save your chatbot"
