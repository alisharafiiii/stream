# ⚠️ Important: Data Persistence Issue

## The Problem
The stream configuration is stored in `/data/stream-config.json` which is:
- ✅ Works locally
- ❌ Doesn't persist on Vercel (serverless environment)

## Current Behavior
When you save configuration in the admin panel:
- It saves to the server's temporary filesystem
- The data is lost when the serverless function shuts down
- Each new deployment starts with empty configuration

## Solutions

### Option 1: Use Environment Variables (Quick Fix)
Set a default stream URL in Vercel:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add: `DEFAULT_STREAM_URL` = `https://youtube.com/embed/QHDKlPYvfHU`

### Option 2: Use a Database (Recommended)
- Vercel KV (Redis)
- PostgreSQL with Vercel
- MongoDB Atlas
- Supabase

### Option 3: Use Vercel Blob Storage
Store the JSON file in Vercel Blob storage for persistence.

## For Testing
The configuration will work temporarily after you save it, but will reset when:
- The serverless function times out (after ~5-10 minutes of inactivity)
- You redeploy the app
- Vercel spins up a new instance

## Temporary Workaround
After each deployment, you'll need to:
1. Go to admin panel
2. Re-enter your stream URL
3. Click "Go Live" and save

This is why your stream wasn't showing - the configuration was lost!

