'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Loader2, ArrowLeft, MapPin, Calendar, DollarSign } from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  priceRange: { min: number; max: number };
  location: { type: 'Point'; coordinates: [number, number] };
  address?: string;
  status: 'open' | 'accepted' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export default function MyJobsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push('/dashboard/jobs');
      return;
    }
    fetchJobs();
  }, [session, router]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/users/jobs');
      const data = await response.json();

      if (response.ok) {
        setJobs(data.jobs || []);
      } else {
        setError(data.error || 'Failed to load jobs');
      }
    } catch (error) {
      console.error('Failed to fetch jobs', error);
      setError('Unable to retrieve jobs right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/jobs"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Jobs</h1>
          <p className="text-sm text-slate-500 mt-1">View all jobs you've posted</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Briefcase size={28} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No jobs posted yet</h3>
          <p className="text-sm text-slate-500 mt-2">
            Start by posting your first job to get started.
          </p>
          <Link
            href="/dashboard/jobs/create"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white px-6 py-3 text-sm font-semibold hover:bg-emerald-600 mt-4"
          >
            Post a Job
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => {
            const jobId = job._id?.toString() || '';
            if (!jobId) {
              console.error('Invalid job ID:', job);
              return null;
            }
            return (
              <Link
                key={jobId}
                href={`/dashboard/jobs/${jobId}`}
                className="block bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{job.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} className="text-emerald-600" />
                        <span className="font-medium text-slate-900">
                          Budget up to Rs. {job.priceRange.max.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase size={16} className="text-slate-400" />
                        <span>{job.category}</span>
                      </div>
                      {job.address && (
                        <div className="flex items-center gap-1">
                          <MapPin size={16} className="text-slate-400" />
                          <span className="truncate max-w-[200px]">{job.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar size={16} className="text-slate-400" />
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          }).filter(Boolean)}
        </div>
      )}
    </div>
  );
}

