'use client';

import Link from 'next/link';
import { ArrowLeft, Hammer, LogIn } from 'lucide-react';
import { useSession } from 'next-auth/react';
import JobForm from '@/components/jobs/JobForm';

export default function CreateJobPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="space-y-8">
        <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600">
          <ArrowLeft size={16} />
          Back to job board
        </Link>
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Login Required</h2>
          <p className="text-sm text-slate-500">You need to log in first to post a job.</p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-emerald-600 transition"
          >
            <LogIn size={16} />
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600">
          <ArrowLeft size={16} />
          Back to job board
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-emerald-600 font-semibold">
            <Hammer size={16} />
            Share your task
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Create a new job</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Provide as many details as possible so that qualified technicians can understand the requirements and send accurate offers.
          </p>
        </div>
      </div>

      <JobForm />
    </div>
  );
}
