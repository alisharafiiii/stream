# Admin Panel Guide

## What Each Button Does:

### 1. **"Save Configuration" Button**
- **Purpose**: Saves your stream settings (title and URL)
- **What it saves**:
  - Stream Title
  - Stream URL (automatically converts YouTube URLs to embed format)
- **Note**: This only saves the configuration but doesn't start the stream

### 2. **"Go Live" / "Go Offline" Button**
- **Purpose**: Toggles the stream between LIVE and OFFLINE states
- **When LIVE**: Stream shows in the mini app
- **When OFFLINE**: Mini app shows "Stream Offline" message
- **Important**: You must click this to actually start streaming after saving your URL

### 3. **"Save & Apply" Button**
- **Purpose**: Saves all settings AND applies the live/offline status
- **This is the main button** that saves everything at once

## How to Stream:

1. **Enter your stream URL** (any YouTube format works)
2. **Enter a title** for your stream  
3. **Toggle "Go Live"** to set status to LIVE
4. **Click "Save & Apply"** to save everything

## Troubleshooting:

**"Failed to update configuration" error**:
- Make sure you're connected with the admin wallet
- Check that your URL is valid
- Try refreshing the page and logging in again

**Stream not showing after save**:
- Make sure you toggled "Go Live" 
- Click "Save & Apply" (not just "Save Configuration")
- Refresh the main app page

## Current Limitations:

On Vercel's free tier, the stream configuration is stored in memory and may reset when the server restarts. For persistent storage, you would need to:
- Set up Vercel KV or a database
- Use environment variables for default streams


