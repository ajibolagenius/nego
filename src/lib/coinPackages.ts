// Coin package configuration for Nego
// Note: This interface matches the database schema
export interface CoinPackage {
  id: string
  coins: number
  price: number // Price in Naira (₦)
  priceInKobo: number // Price in Kobo for Paystack
  displayName: string
  description: string
  popular?: boolean
  bestValue?: boolean
  isNew?: boolean
  isRecommended?: boolean
  is_active?: boolean
  display_order?: number
}

// Legacy interface for backward compatibility
export interface LegacyCoinPackage {
  id: string
  coins: number
  price: number
  priceInKobo: number
  displayName: string
  description: string
  popular?: boolean
  bestValue?: boolean
}

// Coin packages based on 1 Coin = ₦10 rate
// Updated per SERVICE_RECOMMENDATIONS.md
export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'coins-1000',
    coins: 1000,
    price: 10000,
    priceInKobo: 1000000,
    displayName: '1,000 Coins',
    description: 'Starter package - Good for testing the platform',
  },
  {
    id: 'coins-5000',
    coins: 5000,
    price: 50000,
    priceInKobo: 5000000,
    displayName: '5,000 Coins',
    description: 'Standard package - Partial payment towards minimum service',
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
    id: 'coins-15000',
    coins: 15000,
    price: 150000,
    priceInKobo: 15000000,
    displayName: '15,000 Coins',
    description: 'Premium Plus package - One and a half services',
    isRecommended: true,
  },
  {
    id: 'coins-25000',
    coins: 25000,
    price: 250000,
    priceInKobo: 25000000,
    displayName: '25,000 Coins',
    description: 'Deluxe package - Multiple services or premium packages',
  },
  {
    id: 'coins-50000',
    coins: 50000,
    price: 500000,
    priceInKobo: 50000000,
    displayName: '50,000 Coins',
    description: 'Ultimate package - High-value services and multiple bookings',
  },
]

export function getCoinPackageById(id: string): CoinPackage | undefined {
  return COIN_PACKAGES.find((pkg) => pkg.id === id)
}

// Fetch coin packages from database (server-side)
export async function getCoinPackagesFromDB(supabase: any): Promise<CoinPackage[]> {
  try {
    const { data, error } = await supabase
      .from('coin_packages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching coin packages from DB:', error)
      return COIN_PACKAGES // Fallback to hardcoded
    }

    // Transform database format to CoinPackage format
    return (data || []).map((pkg: any) => ({
      id: pkg.id,
      coins: pkg.coins,
      price: pkg.price,
      priceInKobo: pkg.price_in_kobo,
      displayName: pkg.display_name,
      description: pkg.description || '',
      popular: pkg.popular || false,
      bestValue: pkg.best_value || false,
      isNew: pkg.is_new || false,
      isRecommended: pkg.is_recommended || false,
      is_active: pkg.is_active,
      display_order: pkg.display_order
    }))
  } catch (error) {
    console.error('Error in getCoinPackagesFromDB:', error)
    return COIN_PACKAGES // Fallback to hardcoded
  }
}

// Get coin package by ID from database
export async function getCoinPackageByIdFromDB(supabase: any, id: string): Promise<CoinPackage | undefined> {
  try {
    const { data, error } = await supabase
      .from('coin_packages')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return getCoinPackageById(id) // Fallback to hardcoded
    }

    return {
      id: data.id,
      coins: data.coins,
      price: data.price,
      priceInKobo: data.price_in_kobo,
      displayName: data.display_name,
      description: data.description || '',
      popular: data.popular || false,
      bestValue: data.best_value || false,
      isNew: data.is_new || false,
      isRecommended: data.is_recommended || false,
      is_active: data.is_active,
      display_order: data.display_order
    }
  } catch (error) {
    console.error('Error in getCoinPackageByIdFromDB:', error)
    return getCoinPackageById(id) // Fallback to hardcoded
  }
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
