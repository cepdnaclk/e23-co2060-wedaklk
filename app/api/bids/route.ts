// ============================================
// FILE: app/api/bids/route.ts
// Bids API - Submit & Retrieve Bids (TypeScript)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Bid from '@/models/Bid';
import Job from '@/models/Job';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const jobId = req.nextUrl.searchParams.get('jobId');
    if (!jobId || !Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: 'A valid jobId is required' }, { status: 400 });
    }

    const bids = await Bid.find({ jobId })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = bids.map((bid: any) => ({
      ...bid,
      _id: bid._id.toString(),
      jobId: bid.jobId.toString(),
      createdAt: bid.createdAt instanceof Date ? bid.createdAt.toISOString() : bid.createdAt,
    }));

    return NextResponse.json({ bids: formatted }, { status: 200 });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(session.user as any).isVerified) {
      return NextResponse.json({ error: 'Verification required to place bids' }, { status: 403 });
    }

    await connectDB();

    const body = await req.json();
    const { jobId, price, message } = body;

    if (!jobId || !Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: 'A valid jobId is required' }, { status: 400 });
    }

    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'A valid bid price is required' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'A message is required' }, { status: 400 });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.createdBy.userId.toString() === session.user.id) {
      return NextResponse.json({ error: 'You cannot bid on your own job' }, { status: 400 });
    }

    const existingBid = await Bid.findOne({ jobId, 'bidder.userId': new Types.ObjectId(session.user.id) });
    if (existingBid) {
      return NextResponse.json({ error: 'You have already placed a bid on this job' }, { status: 409 });
    }

    const userWithCustomProps = session.user as any;

    const bid = await Bid.create({
      jobId: new Types.ObjectId(jobId),
      bidder: {
        userId: new Types.ObjectId(session.user.id),
        name: session.user.name || `${userWithCustomProps.firstName ?? ''} ${userWithCustomProps.lastName ?? ''}`.trim(),
        email: session.user.email ?? '',
        phone: userWithCustomProps.mobilePhone ?? '',
        nicNumber: userWithCustomProps.nicNumber,
      },
      price,
      message: message.trim(),
    });

    const formattedBid = {
      ...bid.toObject(),
      _id: bid._id.toString(),
      jobId: bid.jobId.toString(),
      createdAt: bid.createdAt.toISOString(),
    };

    return NextResponse.json({ message: 'Bid submitted successfully', bid: formattedBid }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting bid:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'You have already placed a bid on this job' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to submit bid' }, { status: 500 });
  }
}