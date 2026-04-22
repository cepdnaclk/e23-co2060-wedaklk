/**
 * Currency conversion utilities
 * Fetches live USD/LKR exchange rate
 */

// Cache the exchange rate for 10 minutes to avoid excessive API calls
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch the current USD to LKR exchange rate
 * Uses the free exchangerate.host API (no API key required)
 * Falls back to a reasonable default if the API is unavailable
 */
export async function getUsdToLkrRate(): Promise<number> {
  // Return cached rate if still valid
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION_MS) {
    return cachedRate.rate;
  }

  try {
    // Primary: use exchangerate-api (free tier, no key needed)
    const response = await fetch(
      'https://open.er-api.com/v6/latest/USD',
      { next: { revalidate: 600 } } // Next.js cache for 10 min
    );

    if (response.ok) {
      const data = await response.json();
      const rate = data.rates?.LKR;
      if (rate && typeof rate === 'number') {
        cachedRate = { rate, timestamp: Date.now() };
        return rate;
      }
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate from primary API:', error);
  }

  try {
    // Fallback: use another free API
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD'
    );

    if (response.ok) {
      const data = await response.json();
      const rate = data.rates?.LKR;
      if (rate && typeof rate === 'number') {
        cachedRate = { rate, timestamp: Date.now() };
        return rate;
      }
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate from fallback API:', error);
  }

  // Last resort: use a hardcoded approximate rate
  // This should rarely be hit, but prevents total failure
  console.warn('Using fallback exchange rate');
  const FALLBACK_RATE = 320; // approximate USD to LKR
  return FALLBACK_RATE;
}

/**
 * Convert LKR amount to USD
 * @param amountLkr - Amount in Sri Lankan Rupees
 * @param rate - USD to LKR exchange rate
 * @returns Amount in USD formatted to 2 decimal places
 */
export function convertLkrToUsd(amountLkr: number, rate: number): string {
  if (rate <= 0) throw new Error('Invalid exchange rate');
  const usd = amountLkr / rate;
  return usd.toFixed(2);
}

/**
 * Format USD amount for display
 */
export function formatUsdAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `$${num.toFixed(2)}`;
}
