// ============================================
// FILE 5: app/api/auth/register/route.ts
// Registration API Route (TypeScript)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UnverifiedUser from '@/models/UnverifiedUser';
import VerifiedUser from '@/models/VerifiedUser';
import { hashPassword, validateEmail, validatePhone, validatePassword } from '@/lib/auth';

interface RegisterRequestBody {
  firstName: string;
  lastName: string;
  nicNumber: string;
  email: string;
  mobilePhone: string;
  profession: string;
  province: string;
  district: string;
  address: string;
  password: string;
  confirmPassword: string;
  documentType: 'NIC' | 'Passport' | 'Driving License';
  documentFront: string | null;
  documentBack: string | null;
  acceptTerms: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: RegisterRequestBody = await req.json();
    const {
      firstName,
      lastName,
      nicNumber,
      email,
      mobilePhone,
      profession,
      province,
      district,
      address,
      password,
      confirmPassword,
      documentType,
      documentFront,
      documentBack,
      acceptTerms
    } = body;

    // Validation
    if (!firstName || !lastName || !nicNumber || !email || !mobilePhone || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!validatePhone(mobilePhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters with uppercase, lowercase, and number' },
        { status: 400 }
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: 'You must accept the terms and conditions' },
        { status: 400 }
      );
    }

    if (!documentFront || !documentBack) {
      return NextResponse.json(
        { error: 'KYC documents are required' },
        { status: 400 }
      );
    }

    const nicPattern = /^([0-9]{9}[VvXx]|[0-9]{12})$/;
    if (!nicPattern.test(nicNumber)) {
      return NextResponse.json(
        { error: 'Invalid NIC number format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists in either collection
    const existingUnverifiedUser = await UnverifiedUser.findOne({
      $or: [{ email }, { mobilePhone }, { nicNumber }]
    });

    const existingVerifiedUser = await VerifiedUser.findOne({
      $or: [{ email }, { mobilePhone }, { nicNumber }]
    });

    if (existingUnverifiedUser || existingVerifiedUser) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // TODO: Upload files to cloud storage
    const documentFrontUrl = documentFront;
    const documentBackUrl = documentBack;

    // Create new user in unverified-users collection
    const newUser = await UnverifiedUser.create({
      firstName,
      lastName,
      nicNumber,
      email,
      mobilePhone,
      profession,
      province,
      district,
      address,
      password: hashedPassword,
      kyc: {
        documentType,
        documentFrontUrl,
        documentBackUrl
      },

      acceptedTerms: acceptTerms,
      acceptedTermsDate: new Date(),
      isActive: true,
      emailVerified: false
    });

    console.log(`New user registered in unverified-users collection: ${newUser.email} with ID: ${newUser._id}`);

    const userResponse = {
      id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      nicNumber: newUser.nicNumber
    };

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: userResponse
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}