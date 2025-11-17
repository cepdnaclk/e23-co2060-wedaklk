'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { Menu, UserRound, LogOut, ShieldAlert, ShieldCheck, User, ChevronRight, Briefcase } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard/jobs', label: 'Job Board' },
  { href: '/dashboard/jobs/create', label: 'Post a Job' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    setProfileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const initials = useMemo(() => {
    const first = (session?.user?.firstName || session?.user?.name?.split(' ')[0] || '').charAt(0);
    const last = (session?.user?.lastName || session?.user?.name?.split(' ')[1] || '').charAt(0);
    return `${first}${last}`.toUpperCase() || 'U';
  }, [session?.user]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg font-medium text-gray-600">Preparing your dashboard...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const isVerified = Boolean((session.user as any).isVerified);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <Link href="/dashboard/jobs" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Jobak"
                width={140}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'text-sm font-medium transition-colors',
                    pathname?.startsWith(item.href)
                      ? 'text-emerald-600'
                      : 'text-gray-500 hover:text-emerald-600'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation"
              >
                <Menu size={22} />
              </button>

              <div className="relative">
                <button
                  className="relative w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  onClick={() => setProfileOpen((prev) => !prev)}
                >
                  {initials}
                  <span
                    className={clsx(
                      'absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shadow',
                      isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    )}
                  >
                    {isVerified ? 'Verified' : 'Pending'}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-gray-100 bg-white shadow-xl p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <UserRound size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{session.user.firstName ?? session.user.name}</p>
                        {session.user.email && (
                          <p className="text-xs text-gray-500">{session.user.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        {isVerified ? (
                          <ShieldCheck size={16} className="text-emerald-500" />
                        ) : (
                          <ShieldAlert size={16} className="text-red-500" />
                        )}
                        <span className="font-medium">
                          {isVerified ? 'Account Verified' : 'Awaiting Admin Verification'}
                        </span>
                      </div>
                      {!isVerified && (
                        <p>
                          You currently have limited access. You can explore job posts but need admin approval to post jobs or place bids.
                        </p>
                      )}
                      {(session.user as any).nicNumber && (
                        <p className="text-[11px] text-gray-500">NIC: {(session.user as any).nicNumber}</p>
                      )}
                    </div>

                    {isVerified ? (
                      <>
                        <Link
                          href="/dashboard/jobs/my-jobs"
                          className="block border-t border-gray-200 pt-2"
                        >
                          <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                            <div className="flex items-center gap-2">
                              <Briefcase size={16} className="text-gray-600" />
                              <span className="text-sm font-medium text-gray-800">My jobs</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-400" />
                          </button>
                        </Link>
                        <Link
                          href="/dashboard/account"
                          className="block border-t border-gray-200 pt-2"
                        >
                          <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-gray-600" />
                              <span className="text-sm font-medium text-gray-800">My account</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-400" />
                          </button>
                        </Link>
                      </>
                    ) : null}

                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 text-white py-2 text-sm font-medium hover:bg-gray-700"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'block rounded-lg px-3 py-2 text-sm font-medium',
                    pathname?.startsWith(item.href)
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}