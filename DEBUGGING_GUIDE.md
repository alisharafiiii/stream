# Debugging Guide - Sounds & Damage

## To Debug Sounds:

1. **Open Browser Console** (F12)
2. Look for these messages:
   - `🔊 Initializing sounds...` - Shows sound system starting
   - `✅ Loaded sound: damage from /sounds/damage.mp3` - Shows each sound loading
   - `❌ Failed to load sound...` - Shows missing files
   - `🔊 Attempting to play sound: damage` - When trying to play
   - `✅ Playing sound: damage` - When sound plays successfully

3. **Common Issues:**
   - If you see `❌ Failed to load sound`, the .mp3 files aren't in `/public/sounds/`
   - If you see `Not allowed to load local resource`, you need to run the dev server
   - If sounds load but don't play, check browser autoplay policies

## To Debug Damage:

1. **Watch Console for:**
   - `💖 Health Update - Left: 5 Right: 5` - Shows current health
   - `🪚 LEFT/RIGHT got buzzsaw!` - When buzzsaw is collected
   - `💥 COLLISION! Left has buzzsaw: true` - When players collide
   - `🎯 handleCollision called` - When damage should apply
   - `🪚 Setting health from 5 to 4` - When damage is applied

2. **What Should Happen:**
   - Player collects buzzsaw → Gets buzzsaw for 8 seconds
   - Player with buzzsaw hits player without → Victim loses 1 heart
   - Attacker loses buzzsaw after dealing damage
   - Both have buzzsaw → Both lose buzzsaw, no damage

## Quick Test:
1. Open browser console
2. Start game
3. Collect a buzzsaw power-up
4. Hit the other player
5. Check console for all the debug messages

## If Still Not Working:
- Make sure all .mp3 files are in `/public/sounds/` folder
- Try hard refresh (Ctrl+F5)
- Check Network tab in DevTools to see if sounds are loading

