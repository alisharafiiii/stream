# YouTube URL Converter Guide

## How to Convert YouTube URLs for Embedding

### Regular YouTube URLs → Embed URLs

**From:**
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/watch?v=VIDEO_ID&feature=...`
- `https://youtube.com/live/VIDEO_ID`

**To:**
- `https://youtube.com/embed/VIDEO_ID`

### Examples:

1. **Short URL**: 
   - From: `https://youtu.be/QHDKlPYvfHU`
   - To: `https://youtube.com/embed/QHDKlPYvfHU`

2. **Long URL**:
   - From: `https://youtube.com/watch?v=dQw4w9WgXcQ`
   - To: `https://youtube.com/embed/dQw4w9WgXcQ`

3. **Live URL**:
   - From: `https://youtube.com/live/sKKsWjrcUFE`
   - To: `https://youtube.com/embed/sKKsWjrcUFE`

4. **With Parameters**:
   - From: `https://youtube.com/watch?v=ABC123&t=120`
   - To: `https://youtube.com/embed/ABC123?start=120`

### For Autoplay (optional):
Add `?autoplay=1&mute=1` to the embed URL:
```
https://youtube.com/embed/QHDKlPYvfHU?autoplay=1&mute=1
```

### Quick Steps:
1. Find the video ID (the part after `v=` or after `youtu.be/`)
2. Use this format: `https://youtube.com/embed/VIDEO_ID`
3. Add any parameters like `?autoplay=1&mute=1` if needed

