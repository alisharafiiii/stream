// Game Configuration for Horror Deathmatch Mode
// Character images will be AI-generated horror-style portraits (TODO)

export interface Character {
  id: string;
  name: string;
  tagline: string;
  category: string;
  bloodColor: string;
  speed: number; // Multiplier: 0.8 - 1.3
  image?: string; // Path to character image (TODO: Add AI-generated horror portraits)
  deathSound?: string; // Sound effect on death (TODO: Add later)
}

export interface PowerUp {
  id: string;
  name: string;
  icon: string;
  effect: 'heal' | 'buzzsaw' | 'shield' | 'rage' | 'trap';
  duration?: number; // seconds
  sound?: string; // TODO: Add later
}

export interface GameConfig {
  enabled: boolean;
  cooldownDuration: number; // seconds
  battleSpeed: number; // multiplier
  powerUpRate: number; // percentage 0-50
  minBet: number;
  maxBet: number;
}

// Default game settings
export const DEFAULT_GAME_CONFIG: GameConfig = {
  enabled: false,
  cooldownDuration: 30,
  battleSpeed: 1.0,
  powerUpRate: 25,
  minBet: 0.01,
  maxBet: 10
};

// Character Database - Blockchain Category
const BLOCKCHAIN_CHARACTERS: Character[] = [
  {
    id: 'base',
    name: 'BASE',
    tagline: 'The Coinbase Chain',
    category: 'Blockchains',
    bloodColor: '#0052FF',
    speed: 1.1,
    // TODO: Add AI horror portrait
  },
  {
    id: 'solana',
    name: 'SOLANA',
    tagline: 'The Speed Demon',
    category: 'Blockchains',
    bloodColor: '#14F195',
    speed: 1.3,
  },
  {
    id: 'bitcoin',
    name: 'BITCOIN',
    tagline: 'The OG Killer',
    category: 'Blockchains',
    bloodColor: '#F7931A',
    speed: 0.9,
  },
  {
    id: 'ethereum',
    name: 'ETHEREUM',
    tagline: 'The Gas Guzzler',
    category: 'Blockchains',
    bloodColor: '#627EEA',
    speed: 1.0,
  },
  {
    id: 'bnb',
    name: 'BNB',
    tagline: 'The Binance Beast',
    category: 'Blockchains',
    bloodColor: '#F3BA2F',
    speed: 1.15,
  },
  {
    id: 'arbitrum',
    name: 'ARBITRUM',
    tagline: 'The Layer 2 Assassin',
    category: 'Blockchains',
    bloodColor: '#28A0F0',
    speed: 1.2,
  },
  {
    id: 'ton',
    name: 'TON',
    tagline: 'The Telegram Titan',
    category: 'Blockchains',
    bloodColor: '#0088CC',
    speed: 1.1,
  },
  {
    id: 'sui',
    name: 'SUI',
    tagline: 'The New Blood',
    category: 'Blockchains',
    bloodColor: '#4DA2FF',
    speed: 1.25,
  },
];

// Politics Category
const POLITICS_CHARACTERS: Character[] = [
  {
    id: 'putin',
    name: 'PUTIN',
    tagline: 'The Kremlin Killer',
    category: 'Politics',
    bloodColor: '#FF0000',
    speed: 1.0,
  },
  {
    id: 'trump',
    name: 'TRUMP',
    tagline: 'The Tower Titan',
    category: 'Politics',
    bloodColor: '#FF0000',
    speed: 1.05,
  },
  {
    id: 'biden',
    name: 'BIDEN',
    tagline: 'The Delaware Destroyer',
    category: 'Politics',
    bloodColor: '#FF0000',
    speed: 0.95,
  },
  {
    id: 'xi',
    name: 'XI JINPING',
    tagline: "The Dragon's Wrath",
    category: 'Politics',
    bloodColor: '#FF0000',
    speed: 1.0,
  },
];

// Sports Category
const SPORTS_CHARACTERS: Character[] = [
  {
    id: 'messi',
    name: 'MESSI',
    tagline: 'The Argentine Assassin',
    category: 'Sports',
    bloodColor: '#FF0000',
    speed: 1.2,
  },
  {
    id: 'ronaldo',
    name: 'RONALDO',
    tagline: 'The Portuguese Predator',
    category: 'Sports',
    bloodColor: '#FF0000',
    speed: 1.15,
  },
  {
    id: 'lebron',
    name: 'LEBRON',
    tagline: 'The King of Pain',
    category: 'Sports',
    bloodColor: '#FF0000',
    speed: 1.0,
  },
  {
    id: 'tyson',
    name: 'MIKE TYSON',
    tagline: 'Iron Mike',
    category: 'Sports',
    bloodColor: '#FF0000',
    speed: 1.1,
  },
];

// Pop Culture Category
const POP_CULTURE_CHARACTERS: Character[] = [
  {
    id: 'joker',
    name: 'JOKER',
    tagline: 'Clown Prince of Chaos',
    category: 'Pop Culture',
    bloodColor: '#9B59B6',
    speed: 1.15,
  },
  {
    id: 'vader',
    name: 'DARTH VADER',
    tagline: 'Dark Lord',
    category: 'Pop Culture',
    bloodColor: '#000000',
    speed: 0.95,
  },
  {
    id: 'pennywise',
    name: 'PENNYWISE',
    tagline: 'The Dancing Clown',
    category: 'Pop Culture',
    bloodColor: '#FF0000',
    speed: 1.1,
  },
];

// Crypto Memes Category
const CRYPTO_MEME_CHARACTERS: Character[] = [
  {
    id: 'pepe',
    name: 'PEPE',
    tagline: 'The Rare One',
    category: 'Crypto Memes',
    bloodColor: '#00FF00',
    speed: 1.05,
  },
  {
    id: 'doge',
    name: 'DOGE',
    tagline: 'Much Fight, Very Wow',
    category: 'Crypto Memes',
    bloodColor: '#FF0000',
    speed: 1.2,
  },
  {
    id: 'wojak',
    name: 'WOJAK',
    tagline: 'Feel Guy',
    category: 'Crypto Memes',
    bloodColor: '#FF0000',
    speed: 0.9,
  },
];

// All characters combined
export const ALL_CHARACTERS: Character[] = [
  ...BLOCKCHAIN_CHARACTERS,
  ...POLITICS_CHARACTERS,
  ...SPORTS_CHARACTERS,
  ...POP_CULTURE_CHARACTERS,
  ...CRYPTO_MEME_CHARACTERS,
];

// Power-ups configuration
export const POWER_UPS: PowerUp[] = [
  {
    id: 'buzzsaw',
    name: 'BUZZSAW',
    icon: '🪚',
    effect: 'buzzsaw',
    duration: 8,
    // TODO: Add buzzsaw sound
  },
  {
    id: 'syringe',
    name: 'SYRINGE',
    icon: '💉',
    effect: 'heal',
    // TODO: Add heal sound
  },
  {
    id: 'shield',
    name: 'BONE SHIELD',
    icon: '🛡️',
    effect: 'shield',
    // TODO: Add shield sound
  },
  {
    id: 'rage',
    name: 'BLOOD RAGE',
    icon: '⚡',
    effect: 'rage',
    duration: 5,
    // TODO: Add rage sound
  },
  {
    id: 'trap',
    name: 'SPIDER TRAP',
    icon: '🕷️',
    effect: 'trap',
    duration: 3,
    // TODO: Add trap sound
  },
];

// Get random character pair from the same category
export function getRandomCharacterPair(): [Character, Character] {
  // Pick a random category
  const categories = ['Blockchains', 'Politics', 'Sports', 'Pop Culture', 'Crypto Memes'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  // Get characters from that category
  const categoryCharacters = ALL_CHARACTERS.filter(c => c.category === randomCategory);
  
  // If not enough characters in category, fall back to any two
  if (categoryCharacters.length < 2) {
    const shuffled = [...ALL_CHARACTERS].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }
  
  // Pick two random characters from the category
  const shuffled = [...categoryCharacters].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

// Get character by ID
export function getCharacterById(id: string): Character | undefined {
  return ALL_CHARACTERS.find(c => c.id === id);
}

// Get characters by category
export function getCharactersByCategory(category: string): Character[] {
  return ALL_CHARACTERS.filter(c => c.category === category);
}

// Get random power-up
export function getRandomPowerUp(): PowerUp {
  const random = Math.floor(Math.random() * POWER_UPS.length);
  return POWER_UPS[random];
}

