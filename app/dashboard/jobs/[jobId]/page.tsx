'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, MapPin, Wallet, Loader2, UserRound, AlertCircle, Images, Shield, Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import MapSelector from '@/components/jobs/MapSelector';

interface JobDetail {
  _id: string;
  title: string;
  description: string;
  category: string;
  priceRange: { min: number; max: number };
  location: { type: 'Point'; coordinates: [number, number] };
  address?: string;
  radius: number;
  photos: string[];
  createdBy: {
    userId: string;
    name: string;
  };
  status: 'open' | 'accepted' | 'completed';
  distance?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface BidDetail {
  _id: string;
  jobId: string;
  price: number;
  message: string;
  createdAt: string;
  bidder: {
    userId: string;
    name: string;
    email: string;
    phone: string;
  };
}

export default function JobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);

  const [bids, setBids] = useState<BidDetail[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  const [bidPrice, setBidPrice] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isDeletingJob, setIsDeletingJob] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isAcceptingBidId, setIsAcceptingBidId] = useState<string | null>(null);

  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;
  const isVerified = Boolean(session?.user?.isVerified);
  const isOwner = useMemo(() => job && session?.user?.id === job.createdBy.userId, [job, session?.user?.id]);

  const latParam = searchParams?.get('lat');
  const lngParam = searchParams?.get('lng');

  const fetchJob = useCallback(async () => {
    if (!jobId || typeof jobId !== 'string') {
      setJobError('Invalid job ID');
      setJobLoading(false);
      return;
    }
    try {
      setJobLoading(true);
      setJobError(null);

      const params = new URLSearchParams();
      if (latParam && lngParam) {
        params.set('lat', latParam);
        params.set('lng', lngParam);
      }

      const response = await fetch(`/api/jobs/${jobId}?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load job');
      }

      setJob(data.job);
    } catch (error: any) {
      console.error('Failed to fetch job', error);
      setJobError(error.message || 'Unable to fetch job details.');
    } finally {
      setJobLoading(false);
    }
  }, [jobId, latParam, lngParam]);

  const fetchBids = useCallback(async () => {
    if (!jobId) return;
    try {
      setBidsLoading(true);
      setBidError(null);
      const response = await fetch(`/api/bids?jobId=${jobId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bids');
      }
      setBids(data.bids || []);
    } catch (error: any) {
      console.error('Failed to fetch bids', error);
      setBidError(error.message || 'Unable to fetch bids.');
    } finally {
      setBidsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
    fetchBids();
  }, [fetchJob, fetchBids]);

  const handleBidSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isVerified) {
      setBidError('You must be verified to submit bids.');
      return;
    }
    if (isOwner) {
      setBidError('You cannot bid on your own job.');
      return;
    }

    const priceNumber = Number(bidPrice);
    if (!priceNumber || priceNumber <= 0) {
      setBidError('Please enter a valid bid amount.');
      return;
    }

    if (!bidMessage.trim()) {
      setBidError('Please include a short message.');
      return;
    }

    try {
      setIsSubmittingBid(true);
      setBidError(null);

      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          price: priceNumber,
          message: bidMessage.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit bid');
      }

      setBidPrice('');
      setBidMessage('');
      fetchBids();
    } catch (error: any) {
      console.error('Failed to submit bid', error);
      setBidError(error.message || 'Unable to submit bid right now.');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const formattedDistance = useMemo(() => {
    if (!job?.distance) return null;
    return `${job.distance.toFixed(1)} km away`;
  }, [job?.distance]);

  const handleDeleteJob = async () => {
    if (!job) return;
    const confirmed = window.confirm('Are you sure you want to delete this job? This cannot be undone.');
    if (!confirmed) return;

    try {
      setIsDeletingJob(true);
      const response = await fetch(`/api/jobs/${job._id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete job');
      }
      router.push('/dashboard/jobs/my-jobs');
    } catch (error: any) {
      alert(error.message || 'Unable to delete job at the moment.');
    } finally {
      setIsDeletingJob(false);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!job) return;
    setAcceptError(null);
    setIsAcceptingBidId(bidId);

    try {
      const profileResponse = await fetch('/api/users/profile');
      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData.error || 'Failed to check payment details.');
      }

      const hasPaymentInfo = Boolean(profileData.user?.paymentInfo?.cardNumber);

      const searchParams = new URLSearchParams({
        jobId: job._id,
        bidId,
      });

      if (hasPaymentInfo) {
        router.push(`/dashboard/payments/pay-commission?${searchParams.toString()}`);
      } else {
        router.push(`/dashboard/payments/add-card?${searchParams.toString()}`);
      }
    } catch (error: any) {
      console.error('Failed to initiate bid acceptance', error);
      setAcceptError(error.message || 'Unable to start payment process.');
    } finally {
      setIsAcceptingBidId(null);
    }
  };

  if (jobLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
        <Loader2 className="mx-auto animate-spin text-emerald-500" size={32} />
        <p className="mt-3 text-sm text-slate-500">Loading job details…</p>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600">
          <ArrowLeft size={16} />
          Back to job board
        </Link>
        <div className="bg-white border border-red-200 rounded-3xl p-10 text-center text-red-600">
          <AlertCircle className="mx-auto mb-3" size={32} />
          <p className="text-sm font-medium">{jobError || 'Job not found or removed.'}</p>
        </div>
      </div>
    );
  }

  const locationLatLng = {
    lat: job.location.coordinates[1],
    lng: job.location.coordinates[0],
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600">
            <ArrowLeft size={16} />
            Back to job board
          </Link>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-600 font-semibold">
            {job.category} • {job.status}
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <UserRound size={16} className="text-emerald-500" />
              Posted by {job.createdBy.name}
            </span>
            {formattedDistance && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={16} className="text-emerald-500" />
                {formattedDistance}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Wallet size={16} className="text-emerald-500" />
              Budget up to Rs. {job.priceRange.max.toLocaleString()}
            </span>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <Link
              href={`/dashboard/jobs/${job._id}/edit`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={16} />
              Edit job
            </Link>
            <button
              type="button"
              onClick={handleDeleteJob}
              disabled={isDeletingJob}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {isDeletingJob ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Delete job
            </button>
          </div>
        )}
        {!isVerified && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2 max-w-md">
            <Shield size={16} />
            Verify your account to place bids or manage jobs.
          </div>
        )}
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Job description</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            {job.address && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={18} className="text-emerald-500" />
                {job.address}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Service area</h2>
            <MapSelector value={locationLatLng} radius={job.radius} readOnly />
          </div>

          {job.photos?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 inline-flex items-center gap-2">
                <Images size={18} className="text-emerald-500" />
                Reference photos
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {job.photos.map((photo, index) => (
                  <div key={index} className="rounded-2xl overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={`Job reference ${index + 1}`} className="w-full h-40 object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Place a bid</h2>
            {isOwner ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                You posted this job. You can edit or delete it from the job details above.
              </div>
            ) : (
              <form onSubmit={handleBidSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your price (Rs.)</label>
                  <input
                    type="number"
                    min={0}
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                    placeholder="Enter your quoted price"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
                    disabled={!isVerified}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    placeholder="Brief introduction and why you're the right fit"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
                    disabled={!isVerified}
                  />
                </div>
                {bidError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {bidError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!isVerified || isSubmittingBid}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white py-3 text-sm font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
                >
                  {isSubmittingBid && <Loader2 size={16} className="animate-spin" />}
                  Submit bid
                </button>
              </form>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Bids</h2>
            {acceptError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {acceptError}
              </div>
            )}
            {bidsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin text-emerald-500" />
                Loading bids…
              </div>
            ) : bids.length === 0 ? (
              <p className="text-sm text-slate-500">No bids yet. Be the first to respond!</p>
            ) : (
              <div className="space-y-3">
                {bids.map((bid) => (
                  <div key={bid._id} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800 truncate">{bid.bidder.name}</span>
                      <span className="text-emerald-600 font-semibold whitespace-nowrap">
                        Rs. {bid.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{bid.message}</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-slate-400">
                        Submitted on {new Date(bid.createdAt).toLocaleString()}
                      </p>
                      {isOwner && job.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => handleAcceptBid(bid._id)}
                          disabled={isAcceptingBidId === bid._id}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white px-3 py-1 text-xs font-medium hover:bg-emerald-600 disabled:opacity-50"
                        >
                          {isAcceptingBidId === bid._id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          Accept bid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
