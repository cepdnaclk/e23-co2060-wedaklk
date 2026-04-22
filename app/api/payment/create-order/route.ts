import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/paypal';

interface CreateOrderRequest {
  order_id: string;
  amount_usd: string;
  description: string;
  custom_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { order_id, amount_usd, description, custom_id } = body;

    // Validate required fields
    if (!order_id || !amount_usd || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, amount_usd, description' },
        { status: 400 }
      );
    }

    // Validate amount format
    const amountNum = parseFloat(amount_usd);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount value' },
        { status: 400 }
      );
    }

    console.log('Creating PayPal order:', order_id, 'Amount USD:', amount_usd);

    // Create PayPal order
    const paypalOrder = await createOrder({
      amountUsd: amount_usd,
      description,
      customId: custom_id || order_id,
    });

    console.log('PayPal order created:', paypalOrder.id);

    return NextResponse.json({
      orderID: paypalOrder.id,
      status: paypalOrder.status,
      success: true,
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
