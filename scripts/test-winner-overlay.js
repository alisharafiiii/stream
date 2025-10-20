const { Redis } = require('@upstash/redis');

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://lucky-kangaroo-5978.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'Ad9yAAIjcDEwZGJhNWNjYTBkNGE0NDA0OGIyNGE3MjUyZGU2YTE1OXAxMA',
});

async function testWinnerOverlay() {
  try {
    // Get current session
    const currentSessionId = await redis.get('current_betting_session');
    console.log('Current session ID:', currentSessionId);
    
    if (!currentSessionId) {
      console.log('No active session found. Please create a betting session first.');
      return;
    }
    
    // Get session details
    const session = await redis.get(`betting_session:${currentSessionId}`);
    console.log('Session details:', JSON.stringify(session, null, 2));
    
    // Check if session is already resolved
    if (session.status === 'resolved') {
      console.log('Session is already resolved with winner:', session.winner);
      console.log('To test the overlay:');
      console.log('1. Create a new betting session in admin panel');
      console.log('2. Place a bet as a user');
      console.log('3. Freeze betting in admin panel');
      console.log('4. Pick a winner in admin panel');
      console.log('5. The overlay should appear for users who placed bets');
      return;
    }
    
    // If session is open or frozen, show how to resolve it
    if (session.status === 'open') {
      console.log('\nSession is open. To test winner overlay:');
      console.log('1. Place some bets as users');
      console.log('2. Go to admin panel and click "Freeze Betting"');
      console.log('3. Then click "Pick Winner" and select X or O');
    } else if (session.status === 'frozen') {
      console.log('\nSession is frozen. To test winner overlay:');
      console.log('1. Go to admin panel');
      console.log('2. Click "Pick Winner" and select X or O');
      console.log('3. Users who placed bets will see the overlay');
    }
    
    // Show current bets
    const allBets = await redis.hgetall(`betting_session:${currentSessionId}:all_bets`);
    console.log('\nCurrent bets:', allBets);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testWinnerOverlay();
