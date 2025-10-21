# Environment Variables Setup

## Set Default Stream Configuration

To make your stream configuration persist on Vercel, add these environment variables:

### 1. Go to Vercel Dashboard
- Navigate to your project settings
- Click on "Environment Variables"

### 2. Add These Variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `DEFAULT_STREAM_URL` | `https://youtube.com/embed/QHDKlPYvfHU` | Your default stream URL (embed format!) |
| `DEFAULT_STREAM_LIVE` | `true` | Whether stream is live by default |
| `DEFAULT_STREAM_TITLE` | `24/7 Live Stream` | Default stream title |

### 3. Redeploy
After adding environment variables, redeploy your app:
```bash
vercel --prod
```

## How It Works
- If no saved configuration exists, the app will use these environment variables
- This ensures your stream settings persist across deployments
- You can still change settings in the admin panel (but they'll reset on redeploy)

## Example YouTube URLs
- ✅ Correct: `https://youtube.com/embed/QHDKlPYvfHU`
- ❌ Wrong: `https://youtu.be/QHDKlPYvfHU`
- ❌ Wrong: `https://youtube.com/watch?v=QHDKlPYvfHU`



