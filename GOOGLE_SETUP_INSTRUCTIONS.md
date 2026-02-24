# Google Sheets API Setup Instructions

## Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select Project**
   - Create new project or select existing one

3. **Enable APIs**
   - Go to "APIs & Services" > "Library"
   - Search and enable:
     - Google Sheets API
     - Google Drive API

4. **Create Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Add authorized JavaScript origins: `http://localhost:5173`
   - Copy the Client ID

## Step 2: Update Configuration

In `src/utils/googleSheetsService.js`, replace:

```javascript
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const API_KEY = 'YOUR_API_KEY';
```

With your actual credentials:

```javascript
const CLIENT_ID = '123456789-abcdefghijklmnop.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

## Step 3: Test the Integration

1. Start your development server
2. Go to Browse page
3. Wait for "Google API Status: ✅ Ready"
4. Click "📋 Create Google Sheet"
5. Authorize when prompted
6. Sheet will be created automatically with data

## Features

- ✅ Automatic Google Sheet creation
- ✅ OAuth2 authentication
- ✅ Formatted headers
- ✅ Direct data population
- ✅ Opens created sheet automatically
- ✅ Fallback CSV download option

## Security Notes

- API keys are exposed in frontend (normal for this use case)
- OAuth ensures user consent for sheet creation
- Sheets are created in user's Google Drive