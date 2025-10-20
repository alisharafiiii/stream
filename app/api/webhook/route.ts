import { NextRequest, NextResponse } from 'next/server';

// Webhook endpoint for Base mini app notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the webhook event (you can remove this in production)
    console.log('Webhook received:', JSON.stringify(body, null, 2));
    
    // Handle different webhook event types
    // The exact event structure will depend on what Base sends
    const { type, data } = body;
    
    switch (type) {
      case 'user.action':
        // Handle user action events
        console.log('User action:', data);
        break;
      
      case 'app.install':
        // Handle app installation
        console.log('App installed by user:', data);
        break;
      
      case 'app.uninstall':
        // Handle app uninstallation
        console.log('App uninstalled by user:', data);
        break;
      
      default:
        console.log('Unknown webhook type:', type);
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      received: true 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid webhook payload' 
    }, { status: 400 });
  }
}

// Optional: Add webhook signature verification for security
// You would need to implement this based on Base's webhook security documentation
// Example implementation:
// function verifyWebhookSignature(request: NextRequest): boolean {
//   const signature = request.headers.get('x-webhook-signature');
//   // Implement signature verification logic here
//   return true;
// }
