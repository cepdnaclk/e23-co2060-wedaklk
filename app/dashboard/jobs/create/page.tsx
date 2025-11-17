'use client';

import Link from 'next/link';
import { ArrowLeft, Hammer } from 'lucide-react';
import JobForm from '@/components/jobs/JobForm';

export default function CreateJobPage() {
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
