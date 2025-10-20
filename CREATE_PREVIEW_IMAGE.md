# 🎨 Creating a Cool Preview Image

## Current Setup
Your mini app uses `/public/hero.png` as the preview image when shared on Farcaster.

## How to Create a Better Preview Image

### Option 1: Use the HTML Template (Recommended)
1. Open `/public/preview-frame.html` in your browser
2. Take a screenshot (1200x630px)
3. Save as `/public/hero.png`

### Option 2: Design Your Own
Create a 1200x630px image with:
- **Eye-catching gradient background** (purple to pink works well)
- **Large emoji or icon** (📺, 🎬, 🔴, etc.)
- **Bold title**: "Stream Live"
- **Subtitle**: "Watch & Earn • Tip Creators • Join the Stream"
- **"LIVE NOW" badge** in corner

### Option 3: Use Canva/Figma Templates
1. Search for "Twitter Card" or "OG Image" templates
2. Size: 1200x630px
3. Include:
   - App name
   - Live streaming theme
   - Call-to-action

### Option 4: Generate with AI
Use DALL-E, Midjourney, or similar:
```
"Create a 1200x630px social media preview image for a live streaming app called 'Stream Live'. Modern gradient background (purple to blue), large TV emoji in center, bold white text, 'LIVE NOW' badge in corner, minimal design"
```

## Preview Image Best Practices

✅ **DO:**
- Use bright, contrasting colors
- Keep text large and readable
- Show what the app does (streaming)
- Add urgency ("LIVE NOW")
- Use emojis for visual interest

❌ **DON'T:**
- Use too much text
- Make it cluttered
- Use low contrast colors
- Forget mobile preview size

## Testing Your Preview

1. Replace `/public/hero.png` with your new image
2. Deploy: `vercel --prod`
3. Test on Warpcast frame validator
4. Share link and check preview

## Example Design Elements

```
Background: Linear gradient (#667eea → #764ba2)
Main Icon: 📺 (120px)
Title: "Stream Live" (60px, bold, white)
Subtitle: "Watch & Earn • Tip Creators" (24px, white)
Badge: "LIVE NOW" (top right, semi-transparent)
Decorative: Floating circles/bubbles
```

Your preview image is the first thing users see - make it count!

