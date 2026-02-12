import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Mail, Download, ExternalLink } from 'lucide-react';

const PRESS_KIT = [
  { name: 'Brand Guidelines', size: '2.4 MB', format: 'PDF' },
  { name: 'Logo Pack', size: '8.1 MB', format: 'ZIP' },
  { name: 'Founder Photos', size: '12.3 MB', format: 'ZIP' },
  { name: 'Platform Screenshots', size: '15.7 MB', format: 'ZIP' },
];

const MENTIONS = [
  { publication: 'TechCrunch', title: 'DommeDirectory raises $2M to professionalize...', date: 'Jan 2024' },
  { publication: 'Wired', title: 'How technology is changing the adult industry', date: 'Dec 2023' },
  { publication: 'Vice', title: 'Inside the world of professional domination', date: 'Nov 2023' },
];

export default function Press() {
  return (
    <Layout>
      <SEO title="Press - DommeDirectory" description="Media resources and press information." />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Media</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Press &{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Media
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            For press inquiries, interview requests, and media resources.
          </p>
        </div>

        {/* Contact Card */}
        <Card className="max-w-2xl mx-auto mb-16 text-center p-8">
          <Mail className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Press Contact</h2>
          <p className="text-gray-400 mb-4">
            For media inquiries, please contact our press team.
          </p>
          <a href="mailto:press@dommedirectory.com" className="text-red-600 hover:text-red-300 text-lg font-medium">
            press@dommedirectory.com
          </a>
        </Card>

        {/* Press Kit */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Press Kit</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {PRESS_KIT.map((item) => (
              <Card key={item.name} hover className="text-center">
                <Download className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <h3 className="text-white font-medium mb-1">{item.name}</h3>
                <p className="text-gray-500 text-sm">{item.format} • {item.size}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* In The News */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">In The News</h2>
          <div className="space-y-4">
            {MENTIONS.map((mention) => (
              <Card key={mention.title} hover className="flex items-center justify-between">
                <div>
                  <span className="text-red-600 text-sm font-medium">{mention.publication}</span>
                  <h3 className="text-white font-medium">{mention.title}</h3>
                  <span className="text-gray-500 text-sm">{mention.date}</span>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-500" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
