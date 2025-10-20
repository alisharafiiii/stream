// Verify deployment status
console.log('Checking deployment...');

// Test if the app has the latest changes
const checkEndpoint = async (url) => {
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    // Check for pixelBounce animation (new feature)
    if (text.includes('pixelBounce')) {
      console.log('✅ CSS has pixelBounce animation - deployment is updated');
    } else {
      console.log('❌ CSS missing pixelBounce animation - deployment is outdated');
    }
    
    // Check for try-catch in transaction history
    if (text.includes('Error parsing withdrawal')) {
      console.log('✅ Transaction history has error handling');
    }
    
  } catch (error) {
    console.error('Error checking deployment:', error);
  }
};

// Check production URL
const prodUrl = 'https://stream-r54ram8ny-nabus-projects-fb6829d6.vercel.app';
console.log(`\nChecking ${prodUrl}...`);
checkEndpoint(prodUrl);

console.log('\nTo test locally:');
console.log('1. Open http://localhost:3000');
console.log('2. Sign in and check:');
console.log('   - Toggle button should be a purple circle with white border');
console.log('   - When collapsed, button should pulse');
console.log('   - Balance modal should have × close button');
console.log('   - Win/lose overlay should have pixel animations');
