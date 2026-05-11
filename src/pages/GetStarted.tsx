import { UserPlus, Bot, Code, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GetStarted = () => {
  return (
    <div className="public-page-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="public-hero text-center mb-16 p-8 md:p-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Start Capturing Leads in
            <span className="block text-blue-600">Less Than 5 Minutes</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            No credit card required for free plan.
          </p>
          <Link
            to="/login"
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-lg font-medium transition-colors"
          >
            Create Free Account
          </Link>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="modern-glass-card p-8 text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-6 mt-4">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Sign Up Free</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your account in seconds. No credit card needed to start. Choose your plan or start with our free tier.
              </p>
            </div>

            <div className="modern-glass-card p-8 text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-6 mt-4">
                <Bot className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Build Your Bot</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Use our visual builder to customize questions, themes, and behavior for your lead generation bot.
              </p>
            </div>

            <div className="modern-glass-card p-8 text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-6 mt-4">
                <Code className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Embed & Go Live</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Copy your embed code and paste it into your website. Your bot is instantly live and ready to capture leads.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="modern-glass-card border-2 border-blue-500 p-8">
            <div className="inline-block px-4 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
              Free Forever
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Start Free</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Perfect for testing and small projects. Get 3 bots, unlimited chats, and see your first 30 leads completely free.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                3 lead generator bots
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                Unlimited conversations
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                First 30 leads visible
              </li>
            </ul>
            <Link
              to="/login"
              className="block w-full py-3 px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors text-center"
            >
              Start Free
            </Link>
          </div>

          <div className="modern-glass-card border-2 border-blue-500 p-8">
            <div className="inline-block px-4 py-1 bg-blue-600 text-white rounded-full text-sm font-medium mb-6">
              Most Popular
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Start Trial </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get 14 days of full access to Starter or Growth plan. No subscription required during trial.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                14-day free trial
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                Full access to all features
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                Unlimited leads
              </li>
            </ul>
            <Link
              to="/pricing"
              className="block w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-center"
            >
              View Plans & Start Trial
            </Link>
          </div>
        </div>

        <div className="modern-glass-card p-12 text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">What You Get</h2>
          <div className="grid md:grid-cols-4 gap-8 mt-8">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">5 min</div>
              <p className="text-gray-600 dark:text-gray-400">Setup time</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
              <p className="text-gray-600 dark:text-gray-400">Bot availability</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">Unlimited</div>
              <p className="text-gray-600 dark:text-gray-400">Conversations</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">Real-time</div>
              <p className="text-gray-600 dark:text-gray-400">Lead capture</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 text-white text-center shadow-xl shadow-blue-200/40 dark:shadow-black/30">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Flood.chat to capture more leads and provide better customer experiences.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-3 bg-white text-blue-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
