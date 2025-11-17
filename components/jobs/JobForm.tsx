'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud } from 'lucide-react';
import MapSelector from './MapSelector';
import { JOB_CATEGORIES } from './constants';

const CATEGORIES = [...JOB_CATEGORIES];

interface JobFormProps {
  onSuccess?: (job: any) => void;
}

export default function JobForm({ onSuccess }: JobFormProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priceMax, setPriceMax] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      Boolean(
        title.trim() &&
          description.trim() &&
          priceMax &&
          location &&
          !isSubmitting
      ),
    [title, description, priceMax, location, isSubmitting]
  );

  const handlePhotosChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 6);
    if (files.length === 0) {
      setPhotos([]);
      return;
    }

    setError(null);

    const base64Files = await Promise.all(
      files.map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      }))
    );

    setPhotos(base64Files);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(CATEGORIES[0]);
    setPriceMax('');
    setAddress('');
    setLocation(null);
    setPhotos([]);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!(session?.user as any)?.isVerified) {
      setError('You must be verified by the admin before posting a job.');
      return;
    }

    if (!location) {
      setError('Please select a location on the map.');
      return;
    }

    if (!priceMax || Number(priceMax) <= 0) {
      setError('Please provide a valid maximum budget.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/jobs', {
        method: 'POST',
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
          photos,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create job');
        return;
      }

      onSuccess?.(data.job);
      resetForm();
      router.push('/dashboard/jobs?refresh=1');
    } catch (err) {
      console.error('Job creation failed', err);
      setError('Unable to create job at the moment. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!(session?.user as any)?.isVerified) {
    return (
      <div className="bg-white border border-amber-200 rounded-3xl p-8 text-center shadow-sm">
        <div className="text-lg font-semibold text-amber-600 mb-2">Verification Required</div>
        <p className="text-sm text-slate-600">
          Your account is awaiting admin verification. You can explore available jobs, but posting new jobs is disabled until your profile is approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">Job Details</h2>
          <p className="text-sm text-slate-500">Describe the work that needs to be completed so that the right technicians can reach out.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Repair leaking bathroom faucet"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Provide clear details about the task, expectations, and any materials required."
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
            placeholder="Apartment, street, or area"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
          />
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">Location</h2>
          <p className="text-sm text-slate-500">Choose where the job needs to be completed. Technicians nearby will see this job first.</p>
        </header>

        <MapSelector
          value={location}
          onChange={(coords) => {
            setLocation(coords);
          }}
        />
      </section>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">Media (Optional)</h2>
          <p className="text-sm text-slate-500">Upload reference photos to help technicians understand the scope of work. Maximum of 6 images.</p>
        </header>

        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 rounded-3xl py-10 cursor-pointer hover:border-emerald-300 transition">
          <UploadCloud className="text-emerald-500" size={28} />
          <span className="text-sm font-medium text-slate-700">Upload photos</span>
          <span className="text-xs text-slate-500">PNG, JPG up to 5MB each</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotosChange} />
        </label>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative rounded-2xl overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt={`Job photo ${index + 1}`} className="w-full h-32 object-cover" />
              </div>
            ))}
          </div>
        )}
      </section>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white py-3 text-sm font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        Post job
      </button>
    </form>
  );
}
