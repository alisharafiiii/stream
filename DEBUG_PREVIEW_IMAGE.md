# Debugging Preview Image Issues

If the backbase.png preview image is not showing in the Base app:

## 1. Clear Base App Cache
- Close and reopen the Base app
- Or pull down to refresh the feed

## 2. Check Image URL
Visit these URLs in your browser to confirm the image loads:
- https://stream-bay-delta.vercel.app/backbase.png
- https://stream-bay-delta.vercel.app/api/frame

## 3. Re-share Your Mini App
- Delete any existing posts with your mini app
- Share a new post with your mini app link
- The new post should show the updated preview

## 4. Test Frame Preview
You can test your frame preview at:
- https://warpcast.com/~/developers/frames
- Enter: https://stream-bay-delta.vercel.app/api/frame

## 5. Force Metadata Refresh
If Base app is caching old metadata:
1. Add a query parameter to your share URL: 
   `https://stream-bay-delta.vercel.app?v=2`
2. This forces Base to re-fetch metadata

## What We've Set Up:
- `backbase.png` in all preview image fields
- Frame metadata with explicit image URL
- Additional OG tags for better compatibility
- `/api/frame` endpoint for direct frame testing

## Image Requirements:
- Image should be under 10MB
- Recommended: 1200x630px for best display
- PNG format for transparency support

