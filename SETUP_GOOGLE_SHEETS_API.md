# Complete Google Sheets API Setup Guide

## Step 1: Google Cloud Console Setup (5 minutes)

### 1.1 Create Project
1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Project name: "SprintHub Sheets Export"
4. Location (Parent resource): Leave as "No organization" (default)
   - If you have an organization, you can select it, but it's optional
   - For personal/development projects, "No organization" is fine
5. Click "Create"

### 1.2 Enable APIs
1. Go to "APIs & Services" → "Library"
2. Search "Google Sheets API" → Click → Enable
3. Search "Google Drive API" → Click → Enable

### 1.3 Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key (looks like: AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
4. Click "Restrict Key" (optional but recommended)
   - API restrictions → Select "Google Sheets API" and "Google Drive API"
   - Save

### 1.4 Create OAuth Client ID
1. Still in "Credentials" page
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: External
   - App name: "SprintHub"
   - User support email: your email
   - Developer contact: your email
   - Save and Continue (skip scopes)
   - Add test users: your email
   - Save and Continue
4. Back to Create OAuth client ID:
   - Application type: "Web application"
   - Name: "SprintHub Web Client"
   - Authorized JavaScript origins:
     - http://localhost:5173
     - http://localhost:3000
   - Click "Create"
5. Copy the Client ID (looks like: 123456789-abcdefg.apps.googleusercontent.com)

## Step 2: Update Your Code

### 2.1 Update googleSheetsService.js

Replace these lines:
```javascript
const CLIENT_ID = '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

With your actual credentials:
```javascript
const CLIENT_ID = 'YOUR_ACTUAL_CLIENT_ID_HERE.apps.googleusercontent.com';
const API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
```

## Step 3: Test the Integration

1. Restart your development server
2. Go to your application
3. Click "📋 Export to Google Sheets"
4. **First time only:** OAuth popup will appear
5. Click "Allow" to grant permissions
6. Google Sheet will be created automatically with all data
7. Sheet opens in new tab with data already populated

## Step 4: Verify It Works

You should see:
- ✅ OAuth popup (first time only)
- ✅ "Google Sheet created successfully with data!" alert
- ✅ New Google Sheet opens with all employee data
- ✅ No manual import needed

## Troubleshooting

### Error: "Google API not available"
- Make sure both scripts are loaded in index.html
- Check browser console for errors
- Wait a few seconds after page load

### Error: "Invalid client"
- Double-check CLIENT_ID is correct
- Ensure authorized JavaScript origins include your localhost URL

### Error: "Access denied"
- Make sure you clicked "Allow" in OAuth popup
- Check if your email is added as test user in OAuth consent screen

### OAuth popup doesn't appear
- Check if popup blocker is enabled
- Try in incognito mode
- Clear browser cache

## Security Notes

- API Key is safe to expose in frontend (it's restricted to your APIs)
- OAuth ensures user consent for each action
- Sheets are created in user's Google Drive
- No data is stored on your servers

## Production Deployment

For production:
1. Add your production domain to authorized JavaScript origins
2. Update OAuth consent screen to "Published" status
3. Consider adding your company logo and privacy policy

## Cost

- Google Sheets API: FREE (60 requests per minute per user)
- Google Drive API: FREE (1000 requests per 100 seconds)
- More than enough for typical usage

## Result

Once configured, clicking "Export to Google Sheets" will:
1. Show OAuth popup (first time only)
2. Create Google Sheet automatically
3. Populate with all data
4. Open the sheet
5. Done - no manual steps!