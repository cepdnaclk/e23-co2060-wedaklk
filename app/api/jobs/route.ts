// ============================================
// FILE: app/api/jobs/route.ts
// Jobs API - List & Create Jobs (TypeScript)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose, { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Job from '@/models/Job';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const DEFAULT_RADIUS_KM = 25;

function parseCoordinate(value: string | null) {
  if (!value) return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRadius(value: string | null) {
  if (!value) return DEFAULT_RADIUS_KM;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RADIUS_KM;
}

function formatJob(job: any) {
  const formatted: any = {
    ...job,
    _id: job._id.toString(),
    createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
    updatedAt: job.updatedAt instanceof Date ? job.updatedAt.toISOString() : job.updatedAt,
    distance: job.distance !== undefined && job.distance !== null
      ? Number((job.distance / 1000).toFixed(2))
      : null,
  };

  if (job.createdBy) {
    formatted.createdBy = {
      ...job.createdBy,
      userId: job.createdBy.userId?.toString?.() ?? job.createdBy.userId,
    };
  }

  return formatted;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const lat = parseCoordinate(searchParams.get('lat'));
    const lng = parseCoordinate(searchParams.get('lng'));
    const radiusKm = parseRadius(searchParams.get('radius'));
    const category = searchParams.get('category');
    const excludeUser = searchParams.get('excludeUser');

    const matchStage: Record<string, any> = { status: 'open' };
    if (category) {
      matchStage.category = category;
    }
    if (excludeUser && Types.ObjectId.isValid(excludeUser)) {
      matchStage['createdBy.userId'] = { $ne: new Types.ObjectId(excludeUser) };
    }

    let jobs;

    if (lat !== null && lng !== null) {
      const pipeline: any[] = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            maxDistance: radiusKm * 1000,
            distanceField: 'distance',
            spherical: true,
          },
        },
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
      ];

      jobs = await Job.aggregate(pipeline);
    } else {
      jobs = await Job.find(matchStage)
        .sort({ createdAt: -1 })
        .lean();
    }

    const formattedJobs = jobs.map(formatJob);

    return NextResponse.json({ jobs: formattedJobs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve jobs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(session.user as any).isVerified) {
      return NextResponse.json({ error: 'Verification required to create jobs' }, { status: 403 });
    }

    await connectDB();

    const body = await req.json();
    const {
      title,
      description,
      category,
      priceRange,
      location,
      address,
      radius,
      photos = [],
    } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      );
    }

    if (!priceRange || typeof priceRange.min !== 'number' || typeof priceRange.max !== 'number') {
      return NextResponse.json(
        { error: 'Price range is required' },
        { status: 400 }
      );
    }

    if (priceRange.min < 0 || priceRange.max < priceRange.min) {
      return NextResponse.json(
        { error: 'Invalid price range values' },
        { status: 400 }
      );
    }

    if (!location || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return NextResponse.json(
        { error: 'A valid location is required' },
        { status: 400 }
      );
    }

    const [lng, lat] = location.coordinates.map((coord: any) => parseFloat(coord));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: 'Invalid location coordinates' },
        { status: 400 }
      );
    }

    const photosClean: string[] = Array.isArray(photos) ? photos.slice(0, 6) : [];

    const displayName = [session.user.firstName, session.user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || session.user.name || 'Jobak User';

    const job = await Job.create({
      title,
      description,
      category,
      priceRange: {
        min: priceRange.min,
        max: priceRange.max,
      },
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      address,
      radius: radius !== undefined && Number.isFinite(Number(radius)) ? Number(radius) : DEFAULT_RADIUS_KM,
      photos: photosClean,
      createdBy: {
        userId: new mongoose.Types.ObjectId(session.user.id),
        name: displayName,
        email: session.user.email ?? '',
        phone: session.user.mobilePhone ?? '',
        nicNumber: (session.user as any).nicNumber,
      },
      status: 'open',
    });

    const formattedJob = formatJob(job.toObject());

    return NextResponse.json(
      { message: 'Job created successfully', job: formattedJob },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
