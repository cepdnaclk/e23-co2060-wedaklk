// ============================================
// FILE: app/api/users/payment/route.ts
// Update user payment information (TypeScript)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import VerifiedUser from '@/models/VerifiedUser';
import UnverifiedUser from '@/models/UnverifiedUser';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const isVerified = Boolean((session.user as any).isVerified);
    const UserModel = isVerified ? VerifiedUser : UnverifiedUser;

    const user = await UserModel.findById((session.user as any).id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { cardNumber, cardHolderName, expiryDate } = body as {
      cardNumber?: string;
      cardHolderName?: string;
      expiryDate?: string;
    };

    if (!cardNumber || !cardHolderName || !expiryDate) {
      return NextResponse.json(
        { error: 'Card number, card holder name and expiry date are required' },
        { status: 400 }
      );
    }

    (user as any).paymentInfo = {
      cardNumber: cardNumber.slice(-4),
      cardHolderName,
      expiryDate,
    };

    await user.save();

    return NextResponse.json({ message: 'Payment information updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating payment information:', error);
    return NextResponse.json({ error: 'Failed to update payment information' }, { status: 500 });
  }
}


