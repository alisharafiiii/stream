# 🚀 How to Test Your Mini App

## 1. Testing in Base App (Recommended)

### Option A: Direct Link Testing
1. Open the Base app on your phone
2. Share your mini app URL in a Farcaster cast:
   ```
   https://stream-bay-delta.vercel.app
   ```
3. The link will automatically become a mini app card
4. Tap the card to launch your mini app

### Option B: Using Warpcast
1. Open Warpcast app
2. Create a new cast with your URL:
   ```
   Check out my live stream mini app!
   https://stream-bay-delta.vercel.app
   ```
3. Post the cast
4. Your mini app will appear as an embedded card
5. Anyone can tap to open it in Base app

### Option C: Frame Testing
1. Go to [Warpcast Frame Validator](https://warpcast.com/~/developers/frames)
2. Enter your URL: `https://stream-bay-delta.vercel.app`
3. Test the frame preview

## 2. Testing on Base.dev (Preview Tool)

If preview isn't loading, try:

### Quick Fixes:
1. **Clear cache**: Hard refresh the preview page (Cmd+Shift+R or Ctrl+Shift+F5)
2. **Check console**: Open browser DevTools (F12) and check for errors
3. **Try test page**: Use `https://stream-bay-delta.vercel.app/test` as a minimal version

### Common Issues:
- **CORS errors**: Mini app must be served over HTTPS
- **Mixed content**: All resources (images, iframes) must use HTTPS
- **JavaScript errors**: Check browser console for errors
- **Manifest issues**: Verify manifest at `/.well-known/farcaster.json`

## 3. Testing Locally

Run your mini app locally and test:
```bash
npm run dev
```
Then visit: `http://localhost:3000`

## 4. Debug Checklist

✅ **Manifest is valid**: 
```bash
curl https://stream-bay-delta.vercel.app/.well-known/farcaster.json
```

✅ **App loads in browser**:
- Visit directly: https://stream-bay-delta.vercel.app
- Should show stream or "offline" message

✅ **No wallet popups**:
- Main page shouldn't trigger wallet connections
- Only admin panel should use wallet

✅ **HTTPS everywhere**:
- All URLs use https://
- No mixed content warnings

## 5. Share Your Mini App

Once working, share on Farcaster:

**Simple share:**
```
🎥 Live streaming mini app!
https://stream-bay-delta.vercel.app
```

**With description:**
```
Built a mini app that streams video directly in your feed! 
No clicks needed - just scroll and watch 📺

Try it: https://stream-bay-delta.vercel.app
```

## 6. Pro Tips

1. **Test on mobile**: Mini apps are primarily mobile experiences
2. **Check different states**: Test both "live" and "offline" states
3. **Verify autoplay**: Should play muted video automatically
4. **Test in airplane mode**: Ensure graceful offline handling

## Need Help?

If preview still not loading:
1. Check browser console for specific errors
2. Try the test page: `/test`
3. Verify all URLs in manifest are correct
4. Ensure no wallet/Web3 code on main page


