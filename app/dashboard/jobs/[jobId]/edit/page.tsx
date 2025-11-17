'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Hammer, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
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
}

export default function EditJobPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;
  const router = useRouter();
  const { data: session } = useSession();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/jobs/${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load job');
        }

        const j: JobDetail = data.job;
        if (session?.user?.id && j.createdBy.userId !== session.user.id) {
          router.push('/dashboard/jobs');
          return;
        }

        setJob(j);
        setTitle(j.title);
        setDescription(j.description);
        setCategory(j.category);
        setPriceMax(j.priceRange.max.toString());
        setAddress(j.address || '');
        setLocation({
          lat: j.location.coordinates[1],
          lng: j.location.coordinates[0],
        });
      } catch (err: any) {
        console.error('Failed to load job for editing', err);
        setError(err.message || 'Unable to load job for editing.');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId, router, session?.user?.id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!job || !location) return;

    if (!priceMax || Number(priceMax) <= 0) {
      setError('Please provide a valid maximum budget.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/jobs/${job._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          priceRange: {
            min: 0,
            max: Number(priceMax),
          },
          address: address.trim(),
          location: {
            coordinates: [location.lng, location.lat],
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update job');
      }

      router.push(`/dashboard/jobs/${job._id}`);
    } catch (err: any) {
      console.error('Failed to update job', err);
      setError(err.message || 'Unable to update job right now.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!job || error) {
    return (
      <div className="space-y-4">
        <Link href={`/dashboard/jobs/${jobId}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600">
          <ArrowLeft size={16} />
          Back to job
        </Link>
        <div className="bg-white border border-red-200 rounded-3xl p-10 text-center text-red-600">
          {error || 'Job not found or you do not have permission to edit it.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Link href={`/dashboard/jobs/${job._id}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600">
          <ArrowLeft size={16} />
          Back to job
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-emerald-600 font-semibold">
            <Hammer size={16} />
            Update your task
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Edit job</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Adjust the details of your job. Changes will be visible immediately to technicians.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
          <header>
            <h2 className="text-lg font-semibold text-slate-900">Job Details</h2>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Maximum Budget (Rs.)</label>
              <input
                type="number"
                min={0}
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Service Address (Optional)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
            />
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
          <header>
            <h2 className="text-lg font-semibold text-slate-900">Location</h2>
          </header>

          <MapSelector
            value={location}
            onChange={(coords) => {
              setLocation(coords);
            }}
          />
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white py-3 text-sm font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save changes
        </button>
      </form>
    </div>
  );
}


