'use client';

import { MapPin, Wallet, ArrowUpRight, UserRound } from 'lucide-react';
import clsx from 'clsx';

interface JobCardProps {
  job: {
    _id: string;
    title: string;
    description: string;
    category: string;
    priceRange: {
      min: number;
      max: number;
    };
    address?: string;
    distance?: number | null;
    createdBy: {
      name: string;
    };
    status: 'open' | 'accepted' | 'completed';
    createdAt?: string;
  };
  onClick?: (jobId: string) => void;
}

const statusColors: Record<string, string> = {
  open: 'text-emerald-600 bg-emerald-100',
  accepted: 'text-amber-600 bg-amber-100',
  completed: 'text-gray-500 bg-gray-100',
};

export default function JobCard({ job, onClick }: JobCardProps) {
  const summary = job.description.length > 160
    ? `${job.description.substring(0, 157)}...`
    : job.description;

  return (
    <button
      onClick={() => onClick?.(job._id)}
      className="w-full text-left bg-white rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-200 p-6 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold uppercase tracking-wide">
              {job.category}
            </span>
            <span className={clsx('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide', statusColors[job.status] || statusColors.open)}>
              {job.status}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900">{job.title}</h3>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-600">
          <ArrowUpRight size={20} />
        </div>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">
        {summary}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-emerald-500" />
          <span className="font-semibold text-slate-800">
            Budget up to Rs. {job.priceRange.max.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-emerald-500" />
          <span>
            {job.distance !== null && job.distance !== undefined
              ? `${job.distance.toFixed(1)} km away`
              : job.address || 'Exact location shared after acceptance'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <UserRound size={18} className="text-emerald-500" />
          <span>Posted by {job.createdBy.name}</span>
        </div>
      </div>
    </button>
  );
}
