import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Cookie, Settings, Shield, Trash } from 'lucide-react';

const COOKIE_TYPES = [
  {
    icon: Shield,
    title: 'Essential Cookies',
    description: 'Required for the platform to function properly. Cannot be disabled.',
    examples: ['Session authentication', 'Security tokens', 'Load balancing'],
  },
  {
    icon: Settings,
    title: 'Functional Cookies',
    description: 'Enable personalized features and remember your preferences.',
    examples: ['Language preference', 'Theme settings', 'Login state'],
  },
  {
    icon: Cookie,
    title: 'Analytics Cookies',
    description: 'Help us understand how visitors interact with our platform.',
    examples: ['Page views', 'Feature usage', 'Error tracking'],
  },
];

export default function Cookies() {
  return (
    <Layout>
      <SEO title="Cookie Policy - DommeDirectory" description="Learn how we use cookies." />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Legal</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Cookie{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            We use cookies to improve your experience on our platform.
          </p>
          <p className="text-gray-500 text-sm mt-4">Last updated: February 2024</p>
        </div>

        {/* What Are Cookies */}
        <Card className="max-w-4xl mx-auto mb-8 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies?</h2>
          <p className="text-gray-400">
            Cookies are small text files stored on your device when you visit a website. 
            They help us provide you with a better experience by remembering your preferences, 
            keeping you logged in, and understanding how you use our platform.
          </p>
        </Card>

        {/* Cookie Types */}
        <div className="max-w-4xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Types of Cookies We Use</h2>
          <div className="space-y-4">
            {COOKIE_TYPES.map((type) => (
              <Card key={type.title}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <type.icon className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{type.title}</h3>
                    <p className="text-gray-400 text-sm mb-3">{type.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {type.examples.map((example) => (
                        <span key={example} className="text-xs bg-[#1f1f1f] text-gray-500 px-2 py-1 rounded">
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Managing Cookies */}
        <Card className="max-w-4xl mx-auto mb-8 p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trash className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Managing Cookies</h2>
              <p className="text-gray-400 mb-4">
                You can control cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul className="text-gray-400 list-disc list-inside space-y-1 mb-4">
                <li>View cookies stored on your device</li>
                <li>Delete individual cookies or all cookies</li>
                <li>Block cookies from specific websites</li>
                <li>Block all cookies (may impact platform functionality)</li>
              </ul>
              <p className="text-gray-400 text-sm">
                Please note that disabling certain cookies may affect the functionality of our platform.
              </p>
            </div>
          </div>
        </Card>

        {/* Third-Party Cookies */}
        <Card className="max-w-4xl mx-auto p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Third-Party Cookies</h2>
          <p className="text-gray-400 mb-4">
            We may use services from third parties that set their own cookies:
          </p>
          <ul className="text-gray-400 list-disc list-inside space-y-1">
            <li>Payment processing (Stripe)</li>
            <li>Analytics (Google Analytics)</li>
            <li>Security and fraud prevention</li>
          </ul>
          <p className="text-gray-400 mt-4">
            These third parties have their own privacy and cookie policies.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
