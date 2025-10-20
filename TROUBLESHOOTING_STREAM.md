# 🔧 Stream Troubleshooting Guide

## Your Current Situation

I've added a **temporary hardcoded fix** so your YouTube video ([https://youtube.com/embed/QHDKlPYvfHU](https://youtube.com/embed/QHDKlPYvfHU)) will show automatically now!

**Try it now**: Visit https://stream-bay-delta.vercel.app

## Why The Admin Panel Wasn't Working

1. **Data doesn't persist on Vercel** - When you save in the admin panel, it only lasts until the serverless function shuts down (~5-10 minutes)
2. **Each deployment resets** - The saved configuration is lost

## How to Make It Permanent

### Option 1: Environment Variables (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables
2. Add:
   - `DEFAULT_STREAM_URL` = `https://youtube.com/embed/QHDKlPYvfHU`
   - `DEFAULT_STREAM_LIVE` = `true`
   - `DEFAULT_STREAM_TITLE` = `Your Stream Title`
3. Redeploy: `vercel --prod`

### Option 2: Hardcode in the App (Current Fix)
I've temporarily hardcoded your stream in `/app/page.tsx`:
```javascript
if (!data.streamUrl && !data.isLive) {
  data.streamUrl = 'https://youtube.com/embed/QHDKlPYvfHU';
  data.isLive = true;
  data.title = 'Live Stream';
}
```

## YouTube Embed Parameters

The stream now includes these parameters for better playback:
- `autoplay=1` - Starts playing automatically
- `mute=1` - Muted (required for autoplay)
- `playsinline=1` - Plays inline on mobile

## Testing Different Videos

To test with different YouTube videos:
1. Find the video ID (e.g., `dQw4w9WgXcQ` for Rick Roll)
2. Edit line 40 in `/app/page.tsx`:
   ```javascript
   data.streamUrl = 'https://youtube.com/embed/VIDEO_ID_HERE';
   ```
3. Deploy: `vercel --prod`

## Common Issues

### "Video unavailable"
- The video might have embedding disabled
- Try a different video

### No autoplay
- Autoplay requires muted audio
- Already fixed in the code

### Black screen
- The video might be region-restricted
- Try a publicly available video

## Next Steps

1. **Test your stream**: https://stream-bay-delta.vercel.app
2. **Set environment variables** for permanent configuration
3. **Consider a database** for dynamic stream management without redeployment


