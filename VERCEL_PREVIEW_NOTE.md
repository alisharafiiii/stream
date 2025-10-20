# About "Vercel" in the Preview

The "Vercel" text you see at the top is **NOT part of your app** - it's Vercel's preview viewer wrapper.

## How to View Your App Without "Vercel"

1. **Direct URL**: Open the production URL directly in your browser (not through Vercel dashboard)
   - Example: `https://stream-bay-delta.vercel.app`

2. **In Base App**: When you post the link in Base app, it will show "Click n Pray" properly

3. **Local Development**: Run `npm run dev` to see it without any Vercel branding

## What Users See

- Base app users: See "Click n Pray" with your custom branding
- Direct visitors: See your app title in the browser tab
- Only Vercel preview links show "Vercel" at the top

The app metadata is already correctly set to "Click n Pray" in:
- `minikit.config.ts`
- `app/layout.tsx`
- `package.json`
