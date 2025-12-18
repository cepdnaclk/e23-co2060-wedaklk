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
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">Introduction</h2>
                            <p>Welcome to <strong>Wedak.lk</strong>. These Terms and Conditions ("Terms") govern your use of the Wedak.lk website and platform ("Platform"). By registering, accessing, or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use the Platform.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Definitions</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>"Platform"</strong> refers to Wedak.lk, its website, and associated services.</li>
                                <li><strong>"Client"</strong> (formerly Job Owner) refers to a registered user who posts tasks or jobs to be completed.</li>
                                <li><strong>"Service Provider"</strong> (formerly Job Doer) refers to a registered user who bids on and performs tasks for Clients.</li>
                                <li><strong>"Service"</strong> refers to the specific task or job agreed upon between the Client and the Service Provider.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Platform Role</h2>
                            <p>Wedak.lk operates strictly as a marketplace to connect Clients with Service Providers. We are an intermediary venue. Wedak.lk is <strong>not</strong> an employer, employment agency, or supervisor of any Service Provider. We do not control, oversee, or direct the performance of the Services.</p>

                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">3. User Registration and Account Integrity</h2>
                            <h3 >3.1. Accuracy of Information</h3>
                            <p>To access the full functionality of the Platform, you must create an account. You agree to provide true, accurate, current, and complete information during the registration process. Providing false, misleading, or impersonated details is a strict violation of these Terms.</p>

                            <h3>3.2. KYC and Identity Verification</h3>
                            <p>We take the safety of our community seriously. As a condition of using the Platform, specifically for Service Providers, you are required to submit valid Know Your Customer (KYC) documentation, including but not limited to National Identity Cards (NIC), proof of address, and police clearance certificates where applicable. Failure to provide valid documentation may result in the suspension or termination of your account.</p>
                        </section>

                        <section className='space-y-4'>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Bidding and Acceptance</h2>
                            <h3>4.1. The Contract</h3>
                            <p>When a Client accepts a bid from a Service Provider, a binding contract is formed directly between the Client and the Service Provider. Wedak.lk is not a party to this contract.</p>

                            <h3>4.2. Fees and Refund Policy</h3>
                            <p>Any service fees, connection fees, or commissions charged by Wedak.lk to facilitate the connection between the Client and the Service Provider are <strong>strictly non-refundable</strong> once a bid has been accepted. This applies regardless of whether the job is subsequently cancelled, completed, or disputed.</p>
                        </section>

                        <section className='space-y-4'>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Limitation of Liability and Indemnification</h2>
                            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-900">
                                <strong>IMPORTANT NOTICE REGARDING LIABILITY:</strong>
                                <p>Wedak.lk is not responsible for the conduct of any user, whether online or offline.</p>
                            </div>

                            <h3>5.1. Property Damage and Theft</h3>
                            <p>Wedak.lk expressly disclaims any liability for any damage to property, theft, personal injury, or other misconduct arising from the interaction between Clients and Service Providers. <strong>If a Service Provider breaks, damages, or steals items at a Client’s premises, Wedak.lk shall not be held liable.</strong> Clients engage Service Providers at their own risk and are encouraged to secure valuables and supervise the work.</p>

                            <h3>5.2. No Insurance</h3>
                            <p>Unless explicitly stated otherwise, Wedak.lk does not provide insurance coverage for tasks performed. Users are advised to obtain their own insurance coverage.</p>
                        </section>

                        <section className='space-y-4'>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Payment and Financial Disputes</h2>
                            <h3>6.1. Direct Payment Responsibility</h3>
                            <p>It is the sole responsibility of the Service Provider to collect the agreed-upon payment from the Client upon completion of the task. Wedak.lk does not guarantee payment and is not responsible for non-payment by the Client.</p>

                            <h3>6.2. Non-Payment Recourse</h3>
                            <p>In the event that a Client refuses to pay the promised amount:
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Wedak.lk will <strong>not</strong> be liable for the outstanding amount.</li>
                                    <li>The Service Provider may submit a formal complaint and leave a negative review on the Client’s profile.</li>
                                    <li>Wedak.lk reserves the right to review such disputes and, at our sole discretion, suspend or permanently ban the Client's account from the Platform to prevent future misconduct.</li>
                                </ul>
                            </p>
                        </section>

                        <section className='space-y-4'>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">7. User Conduct and Termination</h2>
                            <p>We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Reasons for termination include, but are not limited to:</p>
                            <ul className='list-disc pl-5 space-y-2'>
                                <li>Providing false KYC documents.</li>
                                <li>Harassment, theft, or violence.</li>
                                <li>Consistently failing to pay Service Providers.</li>
                                <li>Circumventing the Platform to avoid fees.</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
