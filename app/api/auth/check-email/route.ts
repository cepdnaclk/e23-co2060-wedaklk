import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnverifiedUser from '@/models/UnverifiedUser';
import VerifiedUser from '@/models/VerifiedUser';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    const existingUnverifiedUser = await UnverifiedUser.findOne({ email: email.toLowerCase() });
    const existingVerifiedUser = await VerifiedUser.findOne({ email: email.toLowerCase() });

    if (existingUnverifiedUser || existingVerifiedUser) {
      return NextResponse.json({ exists: true });
    }

    return NextResponse.json({ exists: false });

  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
