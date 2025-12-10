import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
const merchant_id = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '1232971';
const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET || 'MzYzMDc0NzgwMDE4NDU0MjY1NzA0MTI5OTQ5OTY5MzI0OTU2NzYxNw==';
interface PaymentRequest {
  order_id: string;
  amount: string;
  currency: string;
  items?: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
}
export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();
    const { order_id, amount, currency } = body;

    // Validate required fields
    if (!order_id || !amount || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, amount, currency' },
        { status: 400 }
      );
    }

    // Validate amount format (should be a valid number with max 2 decimals)
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount value' },
        { status: 400 }
      );
    }

    console.log('Payment request for order:', order_id, 'Amount:', amount);

    // Generate the hash value
    const hash = crypto
      .createHash('md5')
      .update(
        merchant_id +
        order_id +
        amount +
        currency +
        crypto
          .createHash('md5')
          .update(merchant_secret)
          .digest('hex')
          .toUpperCase()
      )
      .digest('hex')
      .toUpperCase();

    console.log('Hash generated for order:', order_id);

    return NextResponse.json({
      hash,
      merchant_id,
      success: true
    });
  } catch (error) {
    console.error('Error generating hash:', error);
    return NextResponse.json(
      { error: 'Failed to generate hash' },
      { status: 500 }
    );
  }
}