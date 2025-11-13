# Sound Files Setup Guide

## Where to Place Your Sound Files

Place all your .mp3 sound files in the `/public/sounds/` directory:

```
public/
  sounds/
    dead.mp3         - plays when a player dies at the end
    health.mp3       - plays when health power-up is collected
    speed.mp3        - plays when speed power-up is collected
    2buzzsaw.mp3     - plays when both players have buzzsaw and collide
    buzzsaw.mp3      - plays when buzzsaw power-up is collected
    damage.mp3       - plays when player takes damage from buzzsaw
    leftplayer.mp3   - plays when left player hits any wall
    rightplayer.mp3  - plays when right player hits any wall
```

## Sound Implementation Details

### Fixed Issues:
1. **Buzzsaw now disappears after damaging** - When a player with buzzsaw hits another player, they lose the buzzsaw after dealing damage
2. **Both buzzsaw collision** - When both players have buzzsaw and collide, the `2buzzsaw.mp3` sound plays and both lose their buzzsaws
3. **Player-specific wall sounds** - Left and right players have their own wall bounce sounds
4. **Death sound** - Plays when a player reaches 0 health

### How to Test:
1. Click anywhere on the game arena or the sound button to initialize audio
2. The game will preload all sounds on first interaction
3. Make sure your sound files are in `/public/sounds/` directory
4. Sound volume is set to 50% by default

### Damage System Fixed:
- Hearts now properly deduct when damaged
- Buzzsaw is removed after dealing damage (one-time use)
- Debug logs show when damage is applied

## If Sounds Don't Work:
1. Check browser console for any "Failed to load sound" errors
2. Ensure all .mp3 files are in `/public/sounds/`
3. Try clicking the arena to initialize audio
4. Check that sound is not muted (🔊 icon should be visible)

