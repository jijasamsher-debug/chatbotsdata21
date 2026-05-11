import { Shield } from 'lucide-react';

export const Privacy = () => {
  return (
    <div className="public-page-bg">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="public-hero text-center mb-12 p-8 md:p-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

         <div className="modern-glass-card p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account information (name, email address, password)</li>
                <li>Payment information (processed securely through Razorpay)</li>
                <li>Chatbot configuration data and customizations</li>
                <li>Lead data collected through your chatbots</li>
                <li>Usage data and analytics</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends and usage</li>
                <li>Detect and prevent fraudulent transactions</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Information Sharing</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share your
                information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>With your consent or at your direction</li>
                <li>With service providers who help us operate our business</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Data Security</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                We implement appropriate technical and organizational measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Strict access controls and authentication</li>
                <li>Secure payment processing through trusted providers</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Data Retention</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                We retain your personal information for as long as necessary to provide our services and fulfill
                the purposes outlined in this privacy policy. You may request deletion of your data at any time
                by contacting us.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Your Rights</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Cookies and Tracking</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                We use cookies and similar tracking technologies to collect information about your browsing
                activities and to remember your preferences. You can control cookies through your browser
                settings.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Children's Privacy</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Our services are not directed to children under 13 years of age. We do not knowingly collect
                personal information from children under 13. If you become aware that a child has provided us
                with personal information, please contact us.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Changes to This Policy</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes by
                posting the new policy on this page and updating the "Last updated" date.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Contact Us</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                If you have any questions about this privacy policy or our data practices, please contact us at:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white">Email: privacy@flood.chat</p>
                <p className="font-medium text-gray-900 dark:text-white">Address: Flood.chat Privacy Team, India</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
