# YouTube Navigation Prevention

## How We Keep Users in the App

### 1. **YouTube Embed Parameters**
We use specific parameters to minimize YouTube branding and navigation options:
- `rel=0` - Don't show related videos
- `modestbranding=1` - Minimal YouTube branding
- `disablekb=1` - Disable keyboard controls
- `fs=0` - Disable fullscreen button
- `iv_load_policy=3` - Hide video annotations
- `showinfo=0` - Hide video info

### 2. **Iframe Sandbox**
```html
sandbox="allow-same-origin allow-scripts allow-presentation"
```
This restricts the iframe's capabilities, preventing:
- Navigation to other pages
- Pop-ups
- Form submissions

### 3. **Click Blocker Overlay**
We add invisible overlays that block clicks on:
- **Top area (80px)**: Where YouTube shows the video title
- **Bottom area (50px)**: Where player controls and "Watch on YouTube" appear

The middle area remains clickable for play/pause functionality.

### 4. **CSS Implementation**
```css
.clickBlocker {
  position: absolute;
  pointer-events: none;
  z-index: 10;
}

.clickBlocker::before {
  /* Blocks top area */
  height: 80px;
  pointer-events: all;
}

.clickBlocker::after {
  /* Blocks bottom area */
  height: 50px;
  pointer-events: all;
}
```

## Limitations
- Users can still access YouTube through browser controls (back button, URL bar)
- Some embedded players may have different layouts
- Mobile devices may have different interaction patterns

## Best Practices
1. Always use embed URLs, not watch URLs
2. Keep autoplay muted for browser compatibility
3. Test on multiple devices and browsers
4. Consider using a custom video player for full control


