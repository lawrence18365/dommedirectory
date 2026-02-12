import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Shield, Users, Globe, Heart } from 'lucide-react';

const STATS = [
  { label: 'Active Dommes', value: '500+', icon: Users },
  { label: 'Cities', value: '50+', icon: Globe },
  { label: 'Verified Sessions', value: '10K+', icon: Shield },
  { label: 'Community Members', value: '50K+', icon: Heart },
];

const VALUES = [
  {
    title: 'Safety First',
    description: 'Every profile is identity verified. We prioritize the safety and privacy of both dommes and clients.',
  },
  {
    title: 'Professional Excellence',
    description: 'We support professional dominatrices in building successful, independent practices.',
  },
  {
    title: 'Discretion Guaranteed',
    description: 'Bank-level encryption and discreet billing protect your privacy at every step.',
  },
  {
    title: 'Community Driven',
    description: 'Built by the community, for the community. We listen and evolve based on your feedback.',
  },
];

export default function About() {
  return (
    <Layout>
      <SEO title="About Us - DommeDirectory" description="The premier directory for professional dominatrices. Learn about our mission and values." />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Our Story</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Empowering{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Professional Dommes
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            DommeDirectory was founded with a simple mission: create a safe, professional platform 
            where dominatrices can thrive independently and clients can connect with verified professionals.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {STATS.map((stat) => (
            <Card key={stat.label} className="text-center">
              <stat.icon className="w-8 h-8 text-red-600 mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Mission */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/20 via-red-900/10 to-dark-300 border border-gray-700 p-8 lg:p-12 mb-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/10 rounded-full blur-2xl" />
          
          <div className="relative max-w-3xl">
            <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              We believe that professional domination is a legitimate form of adult entertainment 
              that deserves respect, safety, and professional tools. Our platform provides the 
              technology and community support that allows dommes to focus on what they do best 
              while maintaining complete control over their business.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {VALUES.map((value) => (
              <Card key={value.title} hover>
                <h3 className="text-white font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-gray-400 text-sm">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Join Our Community</h2>
          <p className="text-gray-400 mb-6">Whether you&apos;re a professional domme or seeking one, we welcome you.</p>
        </div>
      </div>
    </Layout>
  );
}
