import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Briefcase, MapPin, DollarSign, Clock } from 'lucide-react';

const BENEFITS = [
  'Competitive salary and equity',
  'Remote-first culture',
  'Health, dental, and vision coverage',
  'Unlimited PTO',
  'Professional development budget',
  'Discreet company swag',
];

const OPEN_POSITIONS = [
  {
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    salary: '$120K - $180K',
  },
  {
    title: 'Community Manager',
    department: 'Operations',
    location: 'Remote',
    type: 'Full-time',
    salary: '$60K - $90K',
  },
  {
    title: 'Content Moderator',
    department: 'Trust & Safety',
    location: 'Remote',
    type: 'Part-time',
    salary: '$25 - $35/hr',
  },
];

export default function Careers() {
  return (
    <Layout>
      <SEO title="Careers - DommeDirectory" description="Join our team and help build the future of professional domination." />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">We&apos;re Hiring</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Join the{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Team
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Help us build a safer, more professional industry. We&apos;re looking for passionate 
            individuals who believe in our mission.
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Why Work With Us</h2>
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-gray-300">
                <div className="w-2 h-2 bg-red-600 rounded-full" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Open Positions</h2>
          
          {OPEN_POSITIONS.length > 0 ? (
            <div className="space-y-4">
              {OPEN_POSITIONS.map((job) => (
                <Card key={job.title} hover className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No Open Positions</h3>
              <p className="text-gray-400 text-sm mb-4">
                We&apos;re not currently hiring, but we&apos;re always interested in meeting talented people.
              </p>
              <Button variant="outline" size="sm">Send General Application</Button>
            </Card>
          )}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            DommeDirectory is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment.
          </p>
        </div>
      </div>
    </Layout>
  );
}
