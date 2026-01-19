// Coin package configuration for Nego
export interface CoinPackage {
  id: string
  coins: number
  price: number // Price in Naira (₦)
  priceInKobo: number // Price in Kobo for Paystack
  displayName: string
  description: string
  popular?: boolean
  bestValue?: boolean
}

// Coin packages based on 1 Coin = ₦10 rate
export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'coins-1000',
    coins: 1000,
    price: 10000,
    priceInKobo: 1000000,
    displayName: '1,000 Coins',
    description: 'Starter package',
  },
  {
    id: 'coins-5000',
    coins: 5000,
    price: 50000,
    priceInKobo: 5000000,
    displayName: '5,000 Coins',
    description: 'Standard package',
    popular: true,
  },
  {
    id: 'coins-10000',
    coins: 10000,
    price: 100000,
    priceInKobo: 10000000,
    displayName: '10,000 Coins',
    description: 'Premium package - One minimum service',
    bestValue: true,
  },
  {
    id: 'coins-25000',
    coins: 25000,
    price: 250000,
    priceInKobo: 25000000,
    displayName: '25,000 Coins',
    description: 'Deluxe package',
  },
  {
    id: 'coins-50000',
    coins: 50000,
    price: 500000,
    priceInKobo: 50000000,
    displayName: '50,000 Coins',
    description: 'Ultimate package',
  },
]

export function getCoinPackageById(id: string): CoinPackage | undefined {
  return COIN_PACKAGES.find((pkg) => pkg.id === id)
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Coin to Naira conversion (1 coin = ₦10)
export const COIN_TO_NAIRA_RATE = 10

export function coinsToNaira(coins: number): number {
  return coins * COIN_TO_NAIRA_RATE
}

export function formatCoinsWithNaira(coins: number): string {
  const naira = coinsToNaira(coins)
  return `${coins.toLocaleString()} coins (${formatNaira(naira)})`
}
