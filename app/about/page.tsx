import React from 'react';
import Footer from '@/components/Footer';

export default function AboutUs() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-green-500 mb-8 text-center">About Us</h1>
          
          <div className="prose prose-lg text-gray-600 mx-auto space-y-6">
            <p>
              Wedak.lk is a specialized peer-to-peer (P2P) service marketplace designed to modernize Sri Lanka's informal gig economy. We address the critical inefficiencies of finding reliable household service providers by connecting "Clients" (householders) directly with skilled "Service Providers" (freelancers/workers) in a secure digital environment.
            </p>
            
            <p>
              Unlike traditional directories or classifieds, Wedak.lk operates on a competitive bidding model. This empowers users to negotiate fair market prices for tasks ranging from home repairs to daily chores, ensuring transparency and fairness for both parties.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Our Business Model</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Free Listings:</strong> Unlike traditional platforms, Clients can post service requirements completely free of charge.</li>
              <li><strong>Success-Based Commission:</strong> We charge a flat 5% commission on the final agreed bid amount. This fee is only applicable when a Client accepts a Service Provider's bid.</li>
              <li><strong>No Hidden Fees:</strong> We do not charge subscription fees or lead generation fees. We only earn when our users succeed.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Key Features</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Mandatory KYC Compliance:</strong> We prioritize safety by requiring National Identity Card (NIC) verification for all Service Providers before they can bid.</li>
              <li><strong>Dynamic Task Posting:</strong> Clients post detailed job requirements with images, descriptions, and location data to attract accurate bids.</li>
              <li><strong>Competitive Bidding Engine:</strong> Service Providers bid on tasks in real-time, allowing for dynamic price discovery based on job complexity.</li>
              <li><strong>Secure Transaction Handling:</strong> All platform fees are processed securely via our payment gateway integrations.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
