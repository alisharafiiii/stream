# Setting Up Vercel KV for Persistent Storage

To enable persistent user profiles and balances, you need to set up Vercel KV:

## 1. Create a KV Database

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the "Storage" tab
3. Click "Create Database"
4. Select "KV" as the database type
5. Choose a name (e.g., "stream-users")
6. Select a region close to your users

## 2. Get Your KV Credentials

After creating the database:
1. Click on your KV database
2. Go to the ".env.local" tab
3. Copy all the environment variables shown

## 3. Add Environment Variables

In your Vercel project settings:
1. Go to "Settings" → "Environment Variables"
2. Add these variables (from step 2):
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

## 4. For Local Development

Create a `.env.local` file in your project root:
```env
KV_URL="your-kv-url"
KV_REST_API_URL="your-kv-rest-api-url"
KV_REST_API_TOKEN="your-kv-rest-api-token"
KV_REST_API_READ_ONLY_TOKEN="your-kv-rest-api-read-only-token"
```

## 5. Redeploy Your App

After adding the environment variables, redeploy your app:
```bash
vercel --prod
```

## How It Works

- **User profiles** are stored with the key `user:{fid}`
- **Balances persist** across sessions
- **Fallback to memory** if KV is not configured (for local testing)

## Testing

1. Sign in to create your profile
2. Add funds to your balance
3. Refresh the page - your balance should persist
4. Sign in from another device - same balance appears

## Important Notes

- Without KV configured, the app uses in-memory storage (data resets on each deployment)
- KV is free for up to 30,000 requests per month
- Each user profile counts as 1 read/write operation


