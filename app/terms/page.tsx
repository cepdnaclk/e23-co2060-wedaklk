import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <Header />

            <main className="max-w-4xl mx-auto px-4 pt-8">
                <Link
                    href="/?mode=register&step=3"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Registration
                </Link>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-slate-900 mb-8">Terms and Conditions</h1>

                    <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
                            <p>
                                Welcome to wedak.lk. By accessing or using our website, you agree to be bound by these Terms and Conditions
                                and our Privacy Policy. If you strictly disagree with any part of these terms, please do not use our website.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">2. User Accounts</h2>
                            <p>
                                To access certain features of the platform, you must register for an account. You agree to provide accurate,
                                current, and complete information during the registration process and to update such information to keep it accurate,
                                current, and complete.
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2">
                                <li>You are responsible for safeguarding your password.</li>
                                <li>You agree not to disclose your password to any third party.</li>
                                <li>You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Services</h2>
                            <p>
                                Wedak.lk provides a platform specifically to connect service providers with customers. We are not a party to any
                                agreements entered into between service providers and customers, nor are we an agent or insurer.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">4. User Conduct</h2>
                            <p>
                                You agree not to use the platform to:
                            </p>
                            <ul className="list-disc pl-5 mt-4 space-y-2">
                                <li>Violate any local, state, national, or international law.</li>
                                <li>Harass, abuse, or harm another person.</li>
                                <li>Post false, misleading, or deceptive content.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Payments</h2>
                            <p>
                                Users are liable for any fees or payments related to the services obtained through the platform. Wedak.lk
                                charges a commission for services facilitated through the platform as described in our fee schedule.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Termination</h2>
                            <p>
                                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever,
                                including without limitation if you breach the Terms.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
