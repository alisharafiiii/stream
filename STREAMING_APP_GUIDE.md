# Stream Live - Mini App Guide

Your live streaming mini app is ready! Here's how to use it:

## 🎥 Features

1. **Live Streaming in Feed**: Videos autoplay directly in the Base app feed
2. **Admin Panel**: Wallet-gated control panel (only you can access)
3. **Multiple Platform Support**: YouTube, Twitch, and other embed-friendly platforms

## 🚀 How to Use

### 1. Deploy First
```bash
vercel --prod
```

### 2. Access Admin Panel
- Go to: `https://your-app-url.vercel.app/admin`
- Connect your wallet (must be: 0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D)
- You'll see the admin dashboard

### 3. Set Up a Stream
1. Enter a stream title
2. Add your stream URL (see formats below)
3. Click "Go Live" to start streaming
4. Click "Save Configuration"

### 📺 Supported Stream Formats

**YouTube Live:**
```
https://youtube.com/embed/VIDEO_ID
```
Example: `https://youtube.com/embed/jfKfPfyJRdk`

**Twitch:**
```
https://player.twitch.tv/?channel=CHANNEL_NAME&parent=your-domain.vercel.app
```
Example: `https://player.twitch.tv/?channel=ninja&parent=stream-bay-delta.vercel.app`

**YouTube Regular Videos:**
```
https://youtube.com/embed/VIDEO_ID?autoplay=1&mute=1
```

**Other Platforms:**
- Any platform that provides iframe embed URLs
- Must allow embedding on your domain

## 🎯 Important Notes

1. **Autoplay Policy**: Most browsers require videos to be muted for autoplay
2. **Domain Restrictions**: Some platforms require you to whitelist your domain
3. **HTTPS Required**: All stream URLs must use HTTPS

## 🔧 Testing

1. After setting a stream URL and going live in admin panel
2. Visit your main app URL: `https://your-app-url.vercel.app`
3. The stream should appear and autoplay

## 🎨 Customization

- Modify `/app/page.module.css` to change the player styling
- Update "offline" message in `/app/page.tsx`
- Change admin wallet in both `/app/page.tsx` and `/app/admin/page.tsx`

## 🚨 Troubleshooting

**Stream not showing?**
- Check if the URL is an embed URL (not regular watch URL)
- Ensure you clicked "Go Live" in admin panel
- Verify the stream platform allows embedding

**Access denied to admin?**
- Make sure you're connected with the correct wallet
- The admin wallet is hardcoded as: 0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D

**Autoplay not working?**
- Add `?autoplay=1&mute=1` to YouTube URLs
- Some platforms don't support autoplay in iframes

## 📝 Data Storage

Stream configuration is stored locally in `/data/stream-config.json` (gitignored).
For production, consider using a database instead.

