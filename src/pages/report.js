import { useState } from 'react';
import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { AlertTriangle, Shield, UserX, MessageSquareOff, Flag, Send } from 'lucide-react';

const REPORT_REASONS = [
  { value: 'fake-profile', label: 'Fake or Impersonating Profile' },
  { value: 'inappropriate-content', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment or Abuse' },
  { value: 'scam', label: 'Scam or Fraud' },
  { value: 'underage', label: 'Underage User' },
  { value: 'other', label: 'Other' },
];

export default function Report() {
  const [formData, setFormData] = useState({
    reason: '',
    profileUrl: '',
    details: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    alert('Thank you for your report. Our team will investigate promptly.');
    setFormData({ reason: '', profileUrl: '', details: '' });
  };

  return (
    <Layout>
      <SEO title="Report - DommeDirectory" description="Report a profile or issue." />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="error" className="mb-4">Report</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Report an{' '}
            <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
              Issue
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Help us keep the community safe. All reports are confidential and investigated promptly.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
          <Card className="text-center">
            <UserX className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">Fake Profile</h3>
            <p className="text-gray-500 text-sm">Impersonation or false information</p>
          </Card>
          <Card className="text-center">
            <MessageSquareOff className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">Harassment</h3>
            <p className="text-gray-500 text-sm">Abusive messages or behavior</p>
          </Card>
          <Card className="text-center">
            <Shield className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">Safety Concern</h3>
            <p className="text-gray-500 text-sm">Immediate safety issue</p>
          </Card>
        </div>

        {/* Report Form */}
        <Card className="max-w-2xl mx-auto p-8">
          <div className="flex items-center gap-3 mb-6">
            <Flag className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-white">Submit a Report</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Reason for Report *</label>
              <select
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full bg-[#1f1f1f] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600/50"
              >
                <option value="">Select a reason...</option>
                {REPORT_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>{reason.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Profile URL (if applicable)</label>
              <input
                type="url"
                value={formData.profileUrl}
                onChange={(e) => setFormData({ ...formData, profileUrl: e.target.value })}
                className="w-full bg-[#1f1f1f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50"
                placeholder="https://dommedirectory.com/listings/..."
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Details *</label>
              <textarea
                required
                rows={5}
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                className="w-full bg-[#1f1f1f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50 resize-none"
                placeholder="Please provide as much detail as possible..."
              />
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-400 text-sm">
                For emergencies or immediate danger, please contact local authorities first. 
                This form is for platform violations only.
              </p>
            </div>
            
            <Button type="submit" variant="danger" fullWidth isLoading={isSubmitting} leftIcon={<Send className="w-4 h-4" />}>
              Submit Report
            </Button>
          </form>
        </Card>

        {/* What Happens Next */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <h3 className="text-white font-semibold mb-2">What happens next?</h3>
          <p className="text-gray-400 text-sm">
            Our trust and safety team reviews all reports within 24 hours. You may be contacted 
            for additional information. All reports remain confidential.
          </p>
        </div>
      </div>
    </Layout>
  );
}
