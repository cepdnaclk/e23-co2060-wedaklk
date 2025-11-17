'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Loader2, Save, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobilePhone?: string;
  nicNumber?: string;
  profession?: string;
  province?: string;
  district?: string;
  address?: string;
  paymentInfo?: {
    cardNumber?: string;
    cardHolderName?: string;
    expiryDate?: string;
  };
}

export default function MyAccountPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mobilePhone, setMobilePhone] = useState('');
  const [address, setAddress] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      router.push('/dashboard/jobs');
      return;
    }
    fetchProfile();
  }, [session, router]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/profile');
      const data = await response.json();

      if (response.ok) {
        setProfile(data.user);
        setMobilePhone(data.user.mobilePhone || '');
        setAddress(data.user.address || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobilePhone, address }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile updated successfully');
        setProfile({ ...profile, mobilePhone, address });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      if (newPassword !== confirmPassword) {
        setError('New password and confirm password do not match');
        setIsSaving(false);
        return;
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowChangePassword(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Failed to change password');
    } finally {
      setIsSaving(false);
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
          <h1 className="text-3xl font-bold text-slate-900">My Account</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage your account details</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
          {success}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <User size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
            <p className="text-sm text-slate-500">Your registration details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
            <input
              type="text"
              value={profile?.firstName || ''}
              disabled
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
            <input
              type="text"
              value={profile?.lastName || ''}
              disabled
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
            <input
              type="text"
              value={mobilePhone}
              onChange={(e) => setMobilePhone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">NIC Number</label>
            <input
              type="text"
              value={profile?.nicNumber || ''}
              disabled
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Profession</label>
            <input
              type="text"
              value={profile?.profession || ''}
              disabled
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Province</label>
            <input
              type="text"
              value={profile?.province || ''}
              disabled
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">District</label>
            <input
              type="text"
              value={profile?.district || ''}
              disabled
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-black placeholder:text-black placeholder:opacity-60"
              placeholder="Enter address"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white px-6 py-3 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Lock size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
            <p className="text-sm text-slate-500">Update your account password</p>
          </div>
        </div>

        <button
          onClick={() => setShowChangePassword(!showChangePassword)}
          className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors text-left"
        >
          <span className="text-sm font-medium text-slate-800">Change Password</span>
          <span className="text-xs text-slate-500">{showChangePassword ? 'Hide' : 'Show'}</span>
        </button>

        {showChangePassword && (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Old Password
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 pr-12 text-black placeholder:text-black placeholder:opacity-60"
                  placeholder="Enter old password"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 pr-12 text-black placeholder:text-black placeholder:opacity-60"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 pr-12 text-black placeholder:text-black placeholder:opacity-60"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleChangePassword}
              disabled={isSaving || !oldPassword || !newPassword || !confirmPassword}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white py-3 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Lock size={16} />
              )}
              Change Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

