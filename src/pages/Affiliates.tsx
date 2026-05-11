import { Link } from 'react-router-dom';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

export const Affiliates = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Become an Affiliate Partner
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Earn up to 30% recurring commission by referring customers to Flood.chat
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">30% Commission</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Earn recurring commission on all referrals for 12 months
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Marketing Support</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get access to banners, landing pages, and marketing materials
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Real-time Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor your referrals and earnings with our affiliate dashboard
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Apply to Join Our Affiliate Program
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Please login or create an account first to submit your affiliate application.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
              >
                Login
              </Link>
              <Link
                to="/get-started"
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors font-semibold"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
