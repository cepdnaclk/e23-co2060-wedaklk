// ============================================
// FILE: app/api/users/profile/route.ts
// User Profile API - Update profile and change password
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import VerifiedUser from '@/models/VerifiedUser';
import UnverifiedUser from '@/models/UnverifiedUser';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const isVerified = Boolean(session.user.isVerified);
    const UserModel = isVerified ? VerifiedUser : UnverifiedUser;

    const user = await UserModel.findById(session.user.id).select('-password -kyc').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const isVerified = Boolean(session.user.isVerified);
    const UserModel = isVerified ? VerifiedUser : UnverifiedUser;

    const user = await UserModel.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { mobilePhone, address } = body;

    // Update phone number if provided
    if (mobilePhone !== undefined) {
      if (typeof mobilePhone !== 'string' || mobilePhone.trim().length === 0) {
        return NextResponse.json(
          { error: 'Mobile phone is required' },
          { status: 400 }
        );
      }
      user.mobilePhone = mobilePhone.trim();
    }

    // Update address if provided
    if (address !== undefined) {
      if (typeof address !== 'string' || address.trim().length === 0) {
        return NextResponse.json(
          { error: 'Address is required' },
          { status: 400 }
        );
      }
      user.address = address.trim();
    }

    await user.save();

    const userObj = user.toObject();
    delete (userObj as any).password;
    delete (userObj as any).kyc;

    return NextResponse.json(
      { message: 'Profile updated successfully', user: userObj },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating profile:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Phone number already in use' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const isVerified = Boolean(session.user.isVerified);
    const UserModel = isVerified ? VerifiedUser : UnverifiedUser;

    const user = await UserModel.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All password fields are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirm password do not match' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return NextResponse.json(
        { error: 'Old password is incorrect' },
        { status: 400 }
      );
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}

