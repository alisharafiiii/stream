import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "@/minikit.config";
import { RootProvider } from "./rootProvider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = "https://stream-bay-delta.vercel.app";

  return {
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    openGraph: {
      title: minikitConfig.miniapp.ogTitle,
      description: minikitConfig.miniapp.ogDescription,
      images: [
        {
          url: minikitConfig.miniapp.ogImageUrl,
          width: 1200,
          height: 630,
          alt: minikitConfig.miniapp.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: minikitConfig.miniapp.ogTitle,
      description: minikitConfig.miniapp.ogDescription,
      images: [minikitConfig.miniapp.ogImageUrl],
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
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
