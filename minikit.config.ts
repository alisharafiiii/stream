const ROOT_URL = "https://stream-production-7739.up.railway.app";

/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjM0ODU2OSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGEzMkU1NzczN2NmM2JGM2M5YTRBRTQ2OTZjNkYzZjdmQzQ0NmIzOTYifQ",
    payload: "eyJkb21haW4iOiJzdHJlYW0tYmF5LWRlbHRhLnZlcmNlbC5hcHAifQ",
    signature: "T1UvvPgr7nB5/aEtk9pq9VUZg3+o81VKkgb6zixstptUnH/Y8Y4NSryyLqfXtnalt3KSAg6DigEGgLQKl01ORhs=",
  },
  baseBuilder: {
    allowedAddresses: [
      "0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D",
      "0x37ed24e7c7311836fd01702a882937138688c1a9",
      "0x2148Cac52C14597131f55786499dc5A11b3e2d2d",
      "0xD8eED2630c3ed60521bB919b1E05F48Ae318aD1a",
      "0xFE48D425bEdca014D9E0a4EcD11D82Fb695611c0",
      "0x6eB860fD157e63604e6a9192dECd347A9A6aD610",
      "0x88652e47d32ee3c905619Eba3C0DDb9fF6A09452"
    ],
  },
  miniapp: {
    version: "1",
    name: "Click n Pray",
    subtitle: "Live betting platform",
    description: "Live betting platform. Click your side and pray for the win. Max 10 dollars per round, winners get 2x payout.",
    screenshotUrls: [`${ROOT_URL}/clicknpray-preview.png`],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/clicknpray-preview.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "entertainment",
    tags: ["betting", "live", "gaming", "entertainment", "prediction"],
    heroImageUrl: `${ROOT_URL}/clicknpray-preview.png`,
    tagline: "Click and Pray to Win 2x",
    ogTitle: "Click n Pray - Live Betting",
    ogDescription: "Click your side and pray for the win. Simple 2x payouts. Max 10 dollars per round.",
    ogImageUrl: `${ROOT_URL}/clicknpray-preview.png`,
    noindex: false,
  },
} as const;
