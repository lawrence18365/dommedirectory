import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Shield, Lock, Eye, Trash2 } from 'lucide-react';

const SECTIONS = [
  {
    icon: Shield,
    title: 'Information We Collect',
    content: `We collect information you provide directly to us, such as when you create an account, 
    fill out your profile, or communicate with other users. This may include your name, email, 
    photos, location, and preferences.`,
  },
  {
    icon: Lock,
    title: 'How We Protect Your Data',
    content: `We use bank-level encryption (AES-256) for all data transmission and storage. 
    Your personal information is stored on secure servers with strict access controls. 
    We never sell your data to third parties.`,
  },
  {
    icon: Eye,
    title: 'What Others Can See',
    content: `Your public profile includes information you choose to share publicly. 
    Private information like your real name, address, and payment details are never 
    visible to other users. You control what appears on your public profile.`,
  },
  {
    icon: Trash2,
    title: 'Your Data Rights',
    content: `You can request a copy of your data, correct inaccurate information, or 
    delete your account at any time. Account deletion permanently removes all your 
    data from our systems within 30 days.`,
  },
];

export default function Privacy() {
  return (
    <Layout>
      <SEO title="Privacy Policy - DommeDirectory" description="Learn how we protect your privacy and data." />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Legal</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Privacy{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Your privacy is fundamental to our platform. We&apos;re committed to protecting your personal information.
          </p>
          <p className="text-gray-500 text-sm mt-4">Last updated: February 2024</p>
        </div>

        {/* Key Points */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">{section.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{section.content}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Full Policy */}
        <Card className="max-w-4xl mx-auto p-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-400 mb-6">
              DommeDirectory (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our platform.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">2. Information Collection</h2>
            <p className="text-gray-400 mb-6">
              We collect personal information that you voluntarily provide when registering, 
              expressing interest in our services, or otherwise contacting us. This includes:
            </p>
            <ul className="text-gray-400 list-disc list-inside mb-6 space-y-1">
              <li>Name and contact information</li>
              <li>Profile information and photos</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Communication data</li>
              <li>Device and usage information</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-4">3. Use of Information</h2>
            <p className="text-gray-400 mb-6">
              We use the information we collect to provide, maintain, and improve our services, 
              communicate with you, verify identities, process payments, and ensure platform safety.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing</h2>
            <p className="text-gray-400 mb-6">
              We do not sell your personal information. We may share data with service providers 
              who assist in operating our platform (e.g., payment processors, hosting providers), 
              or when required by law.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">5. Security</h2>
            <p className="text-gray-400 mb-6">
              We implement appropriate technical and organizational measures to protect your data, 
              including encryption, access controls, and regular security audits.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
            <p className="text-gray-400">
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@dommedirectory.com" className="text-red-600 hover:text-red-300">
                privacy@dommedirectory.com
              </a>.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
