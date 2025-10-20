import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/backbase.png" />
        <meta property="fc:frame:image:aspect_ratio" content="1:1" />
        <meta property="fc:frame:button:1" content="Watch Stream" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${baseUrl}" />
        
        <meta property="og:title" content="Stream Live - Watch & Earn" />
        <meta property="og:description" content="Join live streams, earn rewards, tip creators!" />
        <meta property="og:image" content="${baseUrl}/backbase.png" />
        <meta property="og:url" content="${baseUrl}" />
        
        <title>Stream Live</title>
      </head>
      <body>
        <img src="${baseUrl}/backbase.png" alt="Stream Live Preview" />
      </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
