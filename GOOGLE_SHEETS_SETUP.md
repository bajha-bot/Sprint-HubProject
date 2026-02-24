# Google Sheets API Setup

To enable automatic Google Sheets creation with data, follow these steps:

## 1. Get Google API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create credentials (API Key)
5. Copy the API key

## 2. Add Google API Script
Add this script tag to your `public/index.html`:

```html
<script src="https://apis.google.com/js/api.js"></script>
```

## 3. Update API Key
In `src/utils/googleSheetsAPI.js`, replace:
```javascript
const GOOGLE_SHEETS_API_KEY = 'YOUR_API_KEY';
```
with your actual API key.

## 4. Authentication (Optional)
For better security, you can also add OAuth2 authentication:
- Add client ID to the configuration
- Request user permission to create sheets

## Features
- ✅ Automatically creates new Google Sheet
- ✅ Populates with project data and employee details
- ✅ Opens the created sheet in new tab
- ✅ Fallback to CSV download if API fails

## Security Note
For production, consider using OAuth2 instead of API key for better security.