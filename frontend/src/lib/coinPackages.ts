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

export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'coins-500',
    coins: 500,
    price: 5000,
    priceInKobo: 500000,
    displayName: '500 Coins',
    description: 'Perfect for trying out',
  },
  {
    id: 'coins-1000',
    coins: 1000,
    price: 9500,
    priceInKobo: 950000,
    displayName: '1,000 Coins',
    description: 'Most popular',
    popular: true,
  },
  {
    id: 'coins-2500',
    coins: 2500,
    price: 22500,
    priceInKobo: 2250000,
    displayName: '2,500 Coins',
    description: 'Best value',
    bestValue: true,
  },
  {
    id: 'coins-5000',
    coins: 5000,
    price: 42500,
    priceInKobo: 4250000,
    displayName: '5,000 Coins',
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
