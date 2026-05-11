import { FileText } from 'lucide-react';

export const Terms = () => {
  return (
    <div className="public-page-bg">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="public-hero text-center mb-12 p-8 md:p-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

         <div className="modern-glass-card p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                By accessing and using Flood.chat, you accept and agree to be bound by the terms and provision
                of this agreement. If you do not agree to these terms, please do not use our services.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Description of Service</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Flood.chat provides a SaaS platform for creating and managing chatbots for websites. Our services include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Chatbot builder with customization options</li>
                <li>Lead collection and management</li>
                <li>Knowledge base management</li>
                <li>Analytics and reporting</li>
                <li>Widget embedding capabilities</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Account Registration</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>To use Flood.chat, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Be at least 18 years of age</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Subscription and Payment</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Flood.chat offers both free and paid subscription plans:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>A 14-day free trial is available with no charges</li>
                <li>Subscription fees are charged monthly in advance</li>
                <li>You may cancel your subscription at any time</li>
                <li>Refunds are provided on a case-by-case basis</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Usage Limits</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Your usage is subject to the limits of your subscription plan. Exceeding these limits may
                result in service interruption or additional charges. Limits include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Number of chatbots you can create</li>
                <li>Number of AI-powered bots</li>
                <li>Lead access and visibility</li>
                <li>Storage and bandwidth usage</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Acceptable Use</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>You agree not to use Flood.chat to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Distribute spam or malicious content</li>
                <li>Collect personal information without consent</li>
                <li>Interfere with or disrupt our services</li>
                <li>Attempt to gain unauthorized access to our systems</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Intellectual Property</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Flood.chat and its original content, features, and functionality are owned by us and are
                protected by international copyright, trademark, and other intellectual property laws.
                You retain ownership of the content you create using our platform.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Data and Privacy</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Your use of Flood.chat is also governed by our Privacy Policy. You are responsible for
                complying with all applicable data protection laws when using our services to collect
                and process user data.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Termination</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                We may terminate or suspend your account and access to our services immediately, without
                prior notice, for conduct that we believe violates these Terms or is harmful to other
                users, us, or third parties, or for any other reason.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Disclaimers</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Flood.chat is provided "as is" without warranties of any kind. We do not guarantee that
                our services will be uninterrupted, secure, or error-free. We are not responsible for
                any damages resulting from your use of our services.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Limitation of Liability</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                To the maximum extent permitted by law, Flood.chat shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, or any loss of profits or
                revenues.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Changes to Terms</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any
                material changes. Your continued use of Flood.chat after such modifications constitutes
                your acceptance of the updated terms.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">13. Contact Information</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white">Email: legal@flood.chat</p>
                <p className="font-medium text-gray-900 dark:text-white">Address: Flood.chat Legal Team, India</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
