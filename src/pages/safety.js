import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle, Phone } from 'lucide-react';

const SAFETY_TIPS = [
  {
    icon: Shield,
    title: 'Verify First',
    description: 'Always check for the verified badge before booking. Verified dommes have confirmed their identity.',
  },
  {
    icon: Lock,
    title: 'Keep Communication on Platform',
    description: 'Use our secure messaging system. Never share personal contact info until you feel comfortable.',
  },
  {
    icon: Eye,
    title: 'Trust Your Instincts',
    description: 'If something feels off, it probably is. You can cancel or reschedule at any time.',
  },
  {
    icon: AlertTriangle,
    title: 'Report Suspicious Activity',
    description: 'Use the report button or contact support immediately if you encounter any issues.',
  },
];

const COMMITMENTS = [
  'Identity verification for all professionals',
  'End-to-end encrypted messaging',
  'Secure payment processing',
  '24/7 moderation and support',
  'Discreet billing descriptors',
  'Zero tolerance for abuse or harassment',
];

export default function Safety() {
  return (
    <Layout>
      <SEO title="Safety - DommeDirectory" description="Your safety is our top priority. Learn about our safety guidelines and features." />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Safety First</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Your Safety is Our{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Priority
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            We&apos;ve built DommeDirectory with safety at its core. From identity verification 
            to encrypted messaging, every feature is designed to protect you.
          </p>
        </div>

        {/* Safety Tips */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-12">Safety Guidelines</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {SAFETY_TIPS.map((tip) => (
              <Card key={tip.title} hover className="text-center">
                <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <tip.icon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-white font-semibold mb-2">{tip.title}</h3>
                <p className="text-gray-400 text-sm">{tip.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Our Commitments */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/20 via-red-900/10 to-dark-300 border border-gray-700 p-8 lg:p-12 mb-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/10 rounded-full blur-2xl" />
          
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Safety Commitments</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {COMMITMENTS.map((commitment) => (
                <div key={commitment} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{commitment}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <Card className="max-w-2xl mx-auto text-center p-8 border-red-500/30">
          <Phone className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Need Immediate Help?</h2>
          <p className="text-gray-400 mb-4">
            If you&apos;re in immediate danger, please contact emergency services first.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:911" className="text-red-400 hover:text-red-300 font-medium">
              Emergency: 911
            </a>
            <span className="text-gray-600">|</span>
            <a href="mailto:safety@dommedirectory.com" className="text-red-600 hover:text-red-300 font-medium">
              safety@dommedirectory.com
            </a>
          </div>
        </Card>

        {/* SSC Reminder */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm max-w-2xl mx-auto">
            Remember: All activities on DommeDirectory should follow the principles of{' '}
            <span className="text-red-600">Safe, Sane, and Consensual (SSC)</span> or{' '}
            <span className="text-red-600">Risk-Aware Consensual Kink (RACK)</span>. 
            Always establish boundaries, use safe words, and prioritize mutual respect.
          </p>
        </div>
      </div>
    </Layout>
  );
}
