import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
// import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "@/minikit.config";
import { RootProvider } from "./rootProvider";
import "./globals.css";

// Initialize game loop on server start
// import './game-init'; // Disabled for V2

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = "https://stream-production-7739.up.railway.app";

  return {
    title: "Click n Pray",
    description: "Click your side and pray for the win. Simple 2x payouts.",
    applicationName: "Click n Pray",
    icons: {
      icon: `${baseUrl}/icon.png`,
      apple: `${baseUrl}/icon.png`,
    },
    manifest: '/manifest.json',
    openGraph: {
      type: 'website',
      siteName: 'Click n Pray',
      title: "Click n Pray - Live Betting",
      description: "Click your side and pray for the win. Simple 2x payouts. Max $10 per round.",
      url: baseUrl,
      images: [
        {
          url: `${baseUrl}/clicknpray-preview.png`,
          width: 1200,
          height: 630,
          alt: "Click n Pray",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: '@clicknpray',
      creator: '@clicknpray',
      title: "Click n Pray - Live Betting",
      description: "Click your side and pray for the win. Simple 2x payouts.",
      images: [`${baseUrl}/clicknpray-preview.png`],
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
      minimumScale: 1,
      userScalable: false,
      viewportFit: 'cover',
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": `${baseUrl}/clicknpray-preview.png`,
      "fc:frame:image:aspect_ratio": "1:1",
      "fc:frame:button:1": "Click n Pray",
      "fc:frame:button:1:action": "link",
      "fc:frame:button:1:target": baseUrl,
      "fc:miniapp": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: `${baseUrl}/clicknpray-preview.png`,
        button: {
          title: "🎲 Click n Pray",
          action: {
            name: "Click n Pray",
            type: "launch_miniapp",
          },
        },
      }),
      // Additional meta tags for better preview
      "og:image": `${baseUrl}/clicknpray-preview.png`,
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:alt": "Click n Pray - Live Betting",
      // Additional meta tags for Base app
      "application-name": "Click n Pray",
      "apple-mobile-web-app-title": "Click n Pray",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black",
      "mobile-web-app-capable": "yes",
    },
  };
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootProvider>
      <html lang="en">
        <body 
          className={`${inter.variable} ${sourceCodePro.variable}`}
          suppressHydrationWarning={true}
        >
          {children}
        </body>
      </html>
    </RootProvider>
  );
}
