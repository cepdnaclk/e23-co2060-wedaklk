'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Job {
  _id: string;
  title: string;
  status: 'open' | 'accepted' | 'completed';
  createdAt: string;
}

function MyJobsSection() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      fetchJobs();
    }
  }, [isExpanded]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/jobs');
      const data = await response.json();

      if (response.ok) {
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to fetch jobs', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-800">My jobs</span>
        </div>
        <ChevronRight
          size={16}
          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="pl-6 space-y-1 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">No jobs posted yet</p>
          ) : (
            jobs.map((job) => {
              // Ensure job._id is a valid string
              const jobId = job._id?.toString() || '';
              if (!jobId) {
                console.error('Invalid job ID:', job);
                return null;
              }
              return (
                <Link
                  key={jobId}
                  href={`/dashboard/jobs/${jobId}`}
                  className="block p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{job.title}</p>
                      <p className="text-[10px] text-gray-500 capitalize">{job.status}</p>
                    </div>
                    <ChevronRight size={12} className="text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </Link>
              );
            }).filter(Boolean)
          )}
        </div>
      )}
    </div>
  );
}

export default MyJobsSection;