import { Shield, Lock, Key, Server, Eye, AlertTriangle } from 'lucide-react';

export const Security = () => {
  return (
    <div className="public-page-bg">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="public-hero text-center mb-16 p-8 md:p-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full mb-6">
            <Shield className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Security at Flood.chat</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            We take security seriously. Your data protection is our top priority.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
           <div className="modern-glass-card p-8">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">End-to-End Encryption</h3>
            <p className="text-gray-600 dark:text-gray-400">
              All data transmitted between your browser and our servers is encrypted using industry-standard
              TLS/SSL protocols. Your sensitive information is encrypted at rest using AES-256 encryption.
            </p>
          </div>

           <div className="modern-glass-card p-8">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
              <Key className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Secure Authentication</h3>
            <p className="text-gray-600 dark:text-gray-400">
              We use Firebase Authentication with advanced security features including password hashing,
              rate limiting, and protection against brute force attacks.
            </p>
          </div>

           <div className="modern-glass-card p-8">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <Server className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Infrastructure Security</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our infrastructure is hosted on Firebase and Google Cloud Platform, with layered
              security controls, DDoS protection, and high availability.
            </p>
          </div>

           <div className="modern-glass-card p-8">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Privacy by Design</h3>
            <p className="text-gray-600 dark:text-gray-400">
              We collect only the minimum data necessary to provide our services. You have full control
              over your data with the ability to export or delete it at any time.
            </p>
          </div>
        </div>

        <div className="modern-glass-card p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Security Measures</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Data Protection</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>AES-256 encryption for data at rest</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>TLS 1.3 for data in transit</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Regular automated backups</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Secure key management</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Access Control</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Role-based access control (RBAC)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Multi-factor authentication support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Session timeout and management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>IP whitelisting options</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Monitoring & Auditing</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>24/7 security monitoring</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Automated threat detection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Comprehensive audit logs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Incident response procedures</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Security Program</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Privacy-focused data handling</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Regular security audits</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Secure payment processing practices</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Continuous infrastructure security monitoring</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 text-white mb-8 shadow-xl shadow-blue-200/40 dark:shadow-black/30">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold mb-3">Responsible Disclosure</h3>
              <p className="mb-4 text-blue-100">
                If you discover a security vulnerability, please report it to us responsibly. We appreciate
                your efforts to help keep Flood.chat secure.
              </p>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="font-semibold mb-1">Security Team Contact:</p>
                <p>Email: security@flood.chat</p>
                <p className="text-sm text-blue-100 mt-2">
                  We aim to respond to all security reports within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="modern-glass-card p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Your Responsibility</h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-400">
            <p>
              While we implement robust security measures, we encourage you to take these steps to protect
              your account:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Use a strong, unique password for your Flood.chat account</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Enable two-factor authentication when available</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Never share your account credentials</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Review your account activity regularly</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Report any suspicious activity immediately</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Keep your recovery email and phone number up to date</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
