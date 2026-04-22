import { NextResponse } from 'next/server';
import { getUsdToLkrRate } from '@/lib/utils/currency';

export async function GET() {
  try {
    const rate = await getUsdToLkrRate();

    return NextResponse.json({
      rate,
      currency_pair: 'USD/LKR',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate' },
      { status: 500 }
    );
  }
}
