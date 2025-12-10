// ============================================
// FILE: app/api/bids/accept/route.ts
// Accept Bid & Update Job Status (TypeScript)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Bid from '@/models/Bid';
import Job from '@/models/Job';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { jobId, bidId } = body as { jobId?: string; bidId?: string };

    if (!jobId || !Types.ObjectId.isValid(jobId) || !bidId || !Types.ObjectId.isValid(bidId)) {
      return NextResponse.json({ error: 'Valid jobId and bidId are required' }, { status: 400 });
    }

    // Note: This is a sandbox implementation. In production, integrate with a real payment gateway.
    // The frontend ensures users complete the payment flow before reaching this endpoint.

    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.createdBy.userId.toString() !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (job.status !== 'open') {
      return NextResponse.json({ error: 'Only open jobs can be updated' }, { status: 400 });
    }

    const bid = await Bid.findOne({ _id: new Types.ObjectId(bidId), jobId: new Types.ObjectId(jobId) });
    if (!bid) {
      return NextResponse.json({ error: 'Bid not found for this job' }, { status: 404 });
    }

    job.status = 'accepted';
    await job.save();

    return NextResponse.json({ message: 'Bid accepted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error accepting bid:', error);
    return NextResponse.json({ error: 'Failed to accept bid' }, { status: 500 });
  }
}


