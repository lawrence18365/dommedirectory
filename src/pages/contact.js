import { useState } from 'react';
import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Mail, MessageSquare, Clock, Send } from 'lucide-react';

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'For general inquiries and support',
    value: 'support@dommedirectory.com',
    href: 'mailto:support@dommedirectory.com',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Available for Pro and Elite members',
    value: 'Start Chat',
    action: true,
  },
  {
    icon: Clock,
    title: 'Response Time',
    description: 'We typically respond within',
    value: '24 hours',
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    alert('Thank you for your message! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <Layout>
      <SEO title="Contact Us - DommeDirectory" description="Get in touch with our team." />
      
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Get In Touch</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Contact{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Us
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Have a question or need assistance? We&apos;re here to help.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
          {CONTACT_METHODS.map((method) => (
            <Card key={method.title} className="text-center">
              <method.icon className="w-10 h-10 text-red-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-1">{method.title}</h3>
              <p className="text-gray-500 text-sm mb-3">{method.description}</p>
              {method.href ? (
                <a href={method.href} className="text-red-600 hover:text-red-300 font-medium">
                  {method.value}
                </a>
              ) : method.action ? (
                <Button size="sm" variant="outline">{method.value}</Button>
              ) : (
                <span className="text-white font-medium">{method.value}</span>
              )}
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <Card className="max-w-2xl mx-auto p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Your Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#1f1f1f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#1f1f1f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-[#1f1f1f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50"
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Message</label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-[#1f1f1f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600/50 resize-none"
                placeholder="Tell us more about your inquiry..."
              />
            </div>
            <Button type="submit" fullWidth isLoading={isSubmitting} leftIcon={<Send className="w-4 h-4" />}>
              Send Message
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
