// ============================================
// FILE: app/api/users/jobs/route.ts
// User Jobs API - Get user's posted jobs
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

function formatJob(job: any) {
  const formatted: any = {
    ...job,
    _id: job._id?.toString?.() || String(job._id),
    createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
    updatedAt: job.updatedAt instanceof Date ? job.updatedAt.toISOString() : job.updatedAt,
  };

  if (job.createdBy) {
    formatted.createdBy = {
      ...job.createdBy,
      userId: job.createdBy.userId?.toString?.() ?? String(job.createdBy.userId),
    };
  }

  return formatted;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const jobs = await Job.find({
      'createdBy.userId': new Types.ObjectId(session.user.id),
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedJobs = jobs.map(formatJob);

    return NextResponse.json({ jobs: formattedJobs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user jobs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve jobs' },
      { status: 500 }
    );
  }
}

