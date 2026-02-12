import Link from 'next/link';
import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { CheckCircle, XCircle, AlertCircle, Camera, MessageSquare, Shield } from 'lucide-react';

const ALLOWED = [
  'Professional domination and BDSM services',
  'Fetish and kink-related content',
  'Consensual adult roleplay descriptions',
  'Professional photography and videos',
  'Educational content about BDSM practices',
  'Safety information and guidelines',
];

const PROHIBITED = [
  'Minors or content depicting minors',
  'Non-consensual activities or content',
  'Bestiality or animal-related content',
  'Scat, blood, or extreme violence',
  'Illegal activities or services',
  'Hate speech or discrimination',
  'Doxxing or sharing personal information',
  'Spam or fraudulent content',
];

const GUIDELINES = [
  {
    icon: Camera,
    title: 'Photos & Videos',
    description: 'All media must be original or properly licensed. No explicit genital close-ups.',
  },
  {
    icon: MessageSquare,
    title: 'Messages',
    description: 'Respect boundaries. No harassment, threats, or unsolicited explicit content.',
  },
  {
    icon: Shield,
    title: 'Safety',
    description: 'Follow RACK/SSC principles. Provide accurate information about services.',
  },
];

export default function ContentPolicy() {
  return (
    <Layout>
      <SEO title="Content Policy - DommeDirectory" description="Our content guidelines and policies." />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Community Guidelines</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Content{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Our guidelines ensure a safe, respectful environment for all community members.
          </p>
          <p className="text-gray-500 text-sm mt-4">Last updated: February 2024</p>
        </div>

        {/* Quick Guidelines */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {GUIDELINES.map((guide) => (
            <Card key={guide.title} className="text-center">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <guide.icon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-white font-semibold mb-2">{guide.title}</h3>
              <p className="text-gray-400 text-sm">{guide.description}</p>
            </Card>
          ))}
        </div>

        {/* Allowed vs Prohibited */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          <Card className="border-green-500/30">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">Allowed Content</h2>
            </div>
            <ul className="space-y-2">
              {ALLOWED.map((item) => (
                <li key={item} className="flex items-start gap-2 text-gray-300 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Prohibited Content</h2>
            </div>
            <ul className="space-y-2">
              {PROHIBITED.map((item) => (
                <li key={item} className="flex items-start gap-2 text-gray-300 text-sm">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Zero Tolerance */}
        <Card className="max-w-4xl mx-auto mb-8 border-red-500/30">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Zero Tolerance Policy</h2>
              <p className="text-gray-400">
                We have zero tolerance for content involving minors, non-consensual activities, 
                or illegal services. Any violation results in immediate account termination and 
                may be reported to law enforcement.
              </p>
            </div>
          </div>
        </Card>

        {/* Enforcement */}
        <Card className="max-w-4xl mx-auto p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Enforcement</h2>
          <p className="text-gray-400 mb-4">
            Our moderation team reviews reports and proactively monitors content. Violations may result in:
          </p>
          <ul className="text-gray-400 list-disc list-inside space-y-1">
            <li>Content removal</li>
            <li>Account warnings</li>
            <li>Temporary suspension</li>
            <li>Permanent account termination</li>
            <li>Legal action where appropriate</li>
          </ul>
          <p className="text-gray-400 mt-4">
            If you believe content violates our policy, please{' '}
            <Link href="/report" className="text-red-600 hover:text-red-300">report it</Link>.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
