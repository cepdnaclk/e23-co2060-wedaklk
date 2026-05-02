import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Music2, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white pt-12 pb-8 px-4 md:px-8 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Plumbing</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Electrical</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Carpentry</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Cleaning</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Painting</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Appliance Repair</Link></li>
            </ul>
          </div>

          {/* For Clients */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">For Clients</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Post a Job</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Browse Workers</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Get Bids</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Payment Guide</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* For Workers */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">For Workers</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Become a Worker</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Create Profile</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Find Jobs</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Earnings</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Verification</Link></li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Trust & Safety</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Verified Users</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Secure Payments</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Ratings & Reviews</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Report User</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-gray-500 hover:text-green-500 transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Contact</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-green-500 transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <span className="text-2xl font-bold text-green-500">wadak.lk</span>
            {/* Copyright */}
            <span className="text-gray-500 text-sm">© 2026 Wedak.lk</span>
          </div>
          
          {/* Social Icons */}
          <div className="flex items-center gap-4 text-green-500">
            <Link href="#" className="hover:text-green-600 transition-colors">
              <span className="sr-only">Website</span>
              <Globe size={20} />
            </Link>
            <Link href="#" className="hover:text-green-600 transition-colors">
              <span className="sr-only">Facebook</span>
              <Facebook size={20} />
            </Link>
            <Link href="#" className="hover:text-green-600 transition-colors">
              <span className="sr-only">Instagram</span>
              <Instagram size={20} />
            </Link>
            <Link href="#" className="hover:text-green-500 transition-colors">
              <span className="sr-only">LinkedIn</span>
              <Linkedin size={20} />
            </Link>
            <Link href="#" className="hover:text-green-500 transition-colors">
              <span className="sr-only">TikTok</span>
              <Music2 size={20} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
