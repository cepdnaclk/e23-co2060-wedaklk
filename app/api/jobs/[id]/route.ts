// ============================================
// FILE: app/api/jobs/[id]/route.ts
// Jobs API - Single Job Operations (TypeScript)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';
import Bid from '@/models/Bid';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

function parseCoordinate(value: string | null) {
  if (!value) return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatJob(job: any) {
  const formatted: any = {
    ...job,
    _id: job._id?.toString?.() || String(job._id),
    createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
    updatedAt: job.updatedAt instanceof Date ? job.updatedAt.toISOString() : job.updatedAt,
    distance: job.distance !== undefined && job.distance !== null
      ? Number((job.distance / 1000).toFixed(2))
      : null,
  };

  if (job.createdBy) {
    formatted.createdBy = {
      ...job.createdBy,
      userId: job.createdBy.userId?.toString?.() ?? String(job.createdBy.userId),
    };
  }

  return formatted;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid job id' }, { status: 400 });
    }

    // Try to validate as ObjectId, but also handle string IDs
    let objectId: Types.ObjectId | null = null;
    try {
      if (Types.ObjectId.isValid(id)) {
        objectId = new Types.ObjectId(id);
      } else {
        return NextResponse.json({ error: 'Invalid job id format' }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid job id format' }, { status: 400 });
    }

    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const lat = parseCoordinate(searchParams.get('lat'));
    const lng = parseCoordinate(searchParams.get('lng'));

    let jobDoc: any = null;

    if (lat !== null && lng !== null) {
      const results = await Job.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            distanceField: 'distance',
            spherical: true,
          },
        },
        { $match: { _id: objectId } },
        { $limit: 1 },
      ]);
      jobDoc = results[0];
    } else {
      jobDoc = await Job.findById(objectId).lean();
    }

    if (!jobDoc) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const formattedJob = formatJob(jobDoc);

    return NextResponse.json({ job: formattedJob }, { status: 200 });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    
    if (!id || typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid job id' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.createdBy.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const updatableFields = ['title', 'description', 'category', 'priceRange', 'address', 'radius', 'status', 'photos'];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        if (field === 'priceRange') {
          const { min, max } = body.priceRange || {};
          if (typeof min !== 'number' || typeof max !== 'number' || min < 0 || max < min) {
            return NextResponse.json({ error: 'Invalid price range' }, { status: 400 });
          }
          job.priceRange = { min, max };
        } else if (field === 'photos') {
          job.photos = Array.isArray(body.photos) ? body.photos.slice(0, 6) : [];
        } else {
          (job as any)[field] = body[field];
        }
      }
    }

    if (body.location && Array.isArray(body.location.coordinates) && body.location.coordinates.length === 2) {
      const [lng, lat] = body.location.coordinates.map((coord: any) => parseFloat(coord));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return NextResponse.json({ error: 'Invalid location coordinates' }, { status: 400 });
      }
      job.location = { type: 'Point', coordinates: [lng, lat] } as any;
    }

    await job.save();

    return NextResponse.json({ message: 'Job updated successfully', job: formatJob(job.toObject()) }, { status: 200 });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    
    if (!id || typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid job id' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.createdBy.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Bid.deleteMany({ jobId: job._id });
    await job.deleteOne();

    return NextResponse.json({ message: 'Job deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
