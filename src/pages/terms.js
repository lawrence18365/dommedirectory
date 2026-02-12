import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function Terms() {
  return (
    <Layout>
      <SEO title="Terms of Service - DommeDirectory" description="Terms and conditions for using our platform." />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Legal</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Terms of{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Service
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Please read these terms carefully before using DommeDirectory.
          </p>
          <p className="text-gray-500 text-sm mt-4">Last updated: February 2024</p>
        </div>

        {/* Terms Content */}
        <Card className="max-w-4xl mx-auto p-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-400 mb-6">
              By accessing or using DommeDirectory (&quot;the Platform&quot;), you agree to be bound by these 
              Terms of Service. If you do not agree to these terms, please do not use our services. 
              You must be at least 18 years old to use this platform.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-400 mb-6">
              DommeDirectory is a directory platform that connects consenting adults interested in 
              professional domination services. We are not a party to any agreements between users 
              and do not guarantee the quality of services provided.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
            <p className="text-gray-400 mb-6">
              You are responsible for maintaining the confidentiality of your account credentials 
              and for all activities that occur under your account. You agree to notify us immediately 
              of any unauthorized use of your account.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">4. Prohibited Activities</h2>
            <p className="text-gray-400 mb-4">Users may not:</p>
            <ul className="text-gray-400 list-disc list-inside mb-6 space-y-1">
              <li>Use the platform for any illegal purposes</li>
              <li>Impersonate any person or entity</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Attempt to circumvent our security measures</li>
              <li>Use automated systems to access the platform</li>
              <li>Exchange personal contact information before booking</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-4">5. Content Policy</h2>
            <p className="text-gray-400 mb-6">
              Users are responsible for all content they post. By posting content, you grant us a 
              non-exclusive, worldwide, royalty-free license to use, display, and distribute your 
              content on the platform. We reserve the right to remove any content that violates 
              these terms.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">6. Verification</h2>
            <p className="text-gray-400 mb-6">
              We offer optional verification services to help establish trust. Verification does 
              not constitute an endorsement, and users should exercise their own judgment when 
              engaging with others on the platform.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">7. Payments and Subscriptions</h2>
            <p className="text-gray-400 mb-6">
              Subscription fees are charged in advance. You may cancel at any time, and your 
              subscription will remain active until the end of the current billing period. 
              Refunds are provided at our sole discretion.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-400 mb-6">
              To the maximum extent permitted by law, DommeDirectory shall not be liable for 
              any indirect, incidental, special, consequential, or punitive damages arising from 
              your use of the platform.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">9. Termination</h2>
            <p className="text-gray-400 mb-6">
              We reserve the right to terminate or suspend your account at any time, with or 
              without cause, and with or without notice. Upon termination, your right to use 
              the platform immediately ceases.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">10. Changes to Terms</h2>
            <p className="text-gray-400 mb-6">
              We may update these terms from time to time. We will notify you of any changes 
              by posting the new terms on this page. Your continued use of the platform after 
              such changes constitutes your acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">11. Contact Information</h2>
            <p className="text-gray-400">
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@dommedirectory.com" className="text-red-600 hover:text-red-300">
                legal@dommedirectory.com
              </a>.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
