# Integration Instructions for Project Plan Sheet Feature

## New Files Created:
1. `/src/components/ProjectPlanSheetNew.jsx` - Component to display project plan sheets
2. `/src/utils/projectPlanSheetService.js` - Service to create and manage sheets
3. `/src/pages/browser/BrowserNew.jsx` - New browser page using the feature

## How to Use:

### Option 1: Add Route to App.jsx (Minimal Change)
Add this import at the top of App.jsx:
```javascript
import BrowserNew from "./pages/browser/BrowserNew";
```

Add this route in the Routes section:
```javascript
<Route path="/browser-new" element={<BrowserNew />} />
```

Then navigate to `/browser-new` to use the new feature.

### Option 2: Replace Existing Browser.jsx
Simply replace the content of `/src/pages/browser/Browser.jsx` with the content from `/src/pages/browser/BrowserNew.jsx`

## How It Works:
1. User clicks on "Project Plan1" under any project in the sidebar
2. System checks if a Google Sheet already exists for that project
3. If not, creates a new Google Sheet with black header row containing:
   - Project Name
   - Sprint
   - Tasks Completed (Last Sprint task - Story Points)
   - Story Points
   - Health
   - Emp status
   - Sprint Status
   - %Complete
   - Duration
   - Start Date
   - End Date
   - Leaves Taken
   - Assigned to
   - Tasks Assigned (Current Sprint)
   - Any Comments
4. Sheet is displayed in iframe on the right side
5. Sheet URL is stored in localStorage for future access
6. Users can fill in data directly in the sheet

## Features:
- One static sheet per project (reuses existing sheet on subsequent clicks)
- Black header row with white text
- Anyone with link can edit
- "Open in New Tab" button for full-screen editing
- Auto-resized columns for better visibility
