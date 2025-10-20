# 📝 Optional: Update Vercel Environment Variables

## To Ensure Consistent URLs:

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your `stream` project
3. Go to **Settings** → **Environment Variables**
4. Add/Update:
   - **Key**: `NEXT_PUBLIC_URL`
   - **Value**: `https://stream-bay-delta.vercel.app`
   - **Environment**: All (Production, Preview, Development)
5. Click **Save**

## This Will:
- Ensure all metadata uses the stable URL
- Fix any remaining preview issues
- Make deployments more consistent

## But Remember:
**The immediate fix is just using the stable URL in Base app!**
https://stream-bay-delta.vercel.app
