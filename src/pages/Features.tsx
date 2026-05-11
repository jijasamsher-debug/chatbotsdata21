import { Bot, Palette, FileText, BarChart3, Code2, Zap, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Features = () => {
  return (
    <div className="public-page-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="public-hero text-center mb-16 p-8 md:p-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Everything you need to capture leads
            <span className="block text-blue-600">and answer questions automatically</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Build powerful chatbots that engage visitors, collect leads, and provide instant answers using AI - all without writing a single line of code.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 mb-16">
          <div className="modern-glass-card p-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-6">
              <Bot className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Leads Generator Bot</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Perfect for collecting visitor information through customizable forms. Ask specific questions, validate responses, and automatically save leads to your dashboard. Great for consultations, quotes, sign-ups, and more.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Custom question builder with validation</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Email, phone, text, and select field types</span>
              </li>
              <li className="flex items-start">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Automatic lead capture and organization</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Powerful Customization</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Palette className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Beautiful Themes</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Customize colors, fonts, logos, and avatars to match your brand perfectly. Choose from modern templates or create your own look.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Page Rules</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Show different messages and questions based on the page URL. Perfect for targeted campaigns and context-specific interactions.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Smart Popup Timing</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Control when your bot appears with delay timing, exit intent, and page-specific triggers to maximize engagement.
              </p>
            </div>
          </div>
        </div>

         <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 mb-16 text-white shadow-xl shadow-blue-200/40 dark:shadow-black/30">
          <div className="max-w-3xl mx-auto text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Complete Lead Management</h2>
            <p className="text-xl text-blue-100 mb-6">
              Every lead is automatically saved to your dashboard with all their answers, timestamp, and page visited. Export to CSV, filter by bot, and never miss a potential customer.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-2xl font-bold mb-1">Unlimited</p>
                <p className="text-blue-100">Conversations</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-2xl font-bold mb-1">Real-time</p>
                <p className="text-blue-100">Lead Capture</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-2xl font-bold mb-1">CSV</p>
                <p className="text-blue-100">Export</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Easy Integration</h2>
          <div className="grid md:grid-cols-2 gap-8">
             <div className="modern-glass-card p-8">
              <Code2 className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Simple Embed Code</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Copy and paste a single line of code into your website. Works with any platform - WordPress, Shopify, custom sites, landing pages, and more.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                &lt;iframe src="..." /&gt;
              </div>
            </div>

             <div className="modern-glass-card p-8">
              <Shield className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Secure & Reliable</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Built on Firebase infrastructure with strong security practices. Your data is encrypted, backed up, and always accessible with a privacy-focused approach.
              </p>
            </div>
          </div>
        </div>

        <div className="modern-glass-card p-12 text-center">
          <Users className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Earn with Affiliate Program</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
            Love Flood.chat? Share it with others and earn recurring commission on every referral. Get your unique affiliate link, access to marketing materials, and track your earnings in real-time.
          </p>
          <Link
            to="/affiliates"
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Learn More About Affiliates
          </Link>
        </div>

        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to get started?
          </h2>
          <div className="flex justify-center gap-4">
            <Link
              to="/pricing"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Start Free
            </Link>
            <Link
              to="/pricing"
              className="px-8 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
