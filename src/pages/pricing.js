import { useState } from 'react';
import Layout from '../components/layout/Layout';
import SEO from '../components/ui/SEO';
import PricingCard from '../components/ui/PricingCard';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';

const DOMME_TIERS = [
  {
    tier: 'basic',
    price: '0',
    description: 'Start your journey',
    features: [
      'Basic profile listing',
      'Up to 5 photos',
      'Standard search placement',
      'Email support',
      'Basic analytics',
      'Community access',
    ],
    ctaText: 'Start Free',
  },
  {
    tier: 'pro',
    price: '49',
    description: 'Most popular for professionals',
    features: [
      'Everything in Basic',
      'Unlimited photos',
      'Priority search placement',
      'Video introduction',
      'Advanced analytics',
      'Priority support',
      'Verified badge',
      'Custom booking link',
    ],
    popular: true,
    ctaText: 'Get Pro',
  },
  {
    tier: 'elite',
    price: '99',
    description: 'Maximum exposure',
    features: [
      'Everything in Pro',
      'Homepage featured placement',
      'Top search results',
      'Instagram promotion',
      'Personal account manager',
      'Custom branding',
      'Gold verified badge',
      'Exclusive events access',
      '0% commission on bookings',
    ],
    ctaText: 'Go Elite',
  },
];

const CLIENT_FEATURES = [
  {
    title: 'Advanced Search',
    description: 'Filter by specialty, location, availability, price, and more',
  },
  {
    title: 'Verified Reviews',
    description: 'Read authentic reviews from verified sessions',
  },
  {
    title: 'Safety First',
    description: 'All dommes are identity verified for your safety',
  },
  {
    title: 'Secure Messaging',
    description: 'Private, encrypted communication with dommes',
  },
  {
    title: 'Easy Booking',
    description: 'Book sessions directly through the platform',
  },
  {
    title: 'Exclusive Access',
    description: 'Premium members get early access to new dommes',
  },
];

const FAQS = [
  {
    question: 'How does DommeDirectory make money?',
    answer: 'We charge dommes a monthly subscription fee for premium features. We never take a commission from your session earnings. Clients use the platform for free.',
  },
  {
    question: 'Is my privacy protected?',
    answer: 'Absolutely. We use bank-level encryption, never share your data with third parties, and offer discreet billing. Your safety is our top priority.',
  },
  {
    question: 'How does verification work?',
    answer: 'We verify identity through government ID and video call. Gold verification includes background checks. Platinum requires a minimum rating and interview.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time with no penalties. Your profile will revert to the free tier at the end of your billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and cryptocurrency for maximum privacy.',
  },
];

function FAQItem({ question, answer, isOpen, onClick }) {
  return (
    <div className="border-b border-gray-800 last:border-0">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-white font-medium">{question}</span>
        <svg
          className={`w-5 h-5 text-red-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <p className="text-gray-400 text-sm pb-4 animate-fadeIn">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function Pricing() {
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState(0);

  const handleSubscribe = (tier) => {
    showToast(`Redirecting to ${tier} checkout...`, 'info');
  };

  return (
    <Layout>
      <SEO
        title="Pricing - DommeDirectory Membership Plans"
        description="Choose the perfect plan for your professional domination practice. Start free, upgrade for maximum exposure."
      />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Simple Pricing</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Power Level
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Start free and scale as you grow. No hidden fees, no commission on your earnings.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {DOMME_TIERS.map((tier) => (
            <PricingCard
              key={tier.tier}
              {...tier}
              onCtaClick={() => handleSubscribe(tier.tier)}
            />
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 mb-20">
          {[
            { text: 'Bank-level Security' },
            { text: 'Instant Verification' },
            { text: 'Keep 100% Earnings' },
            { text: '24/7 Support' },
            { text: 'Instant Activation' },
          ].map((badge) => (
            <div key={badge.text} className="flex items-center gap-2 text-gray-400">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">{badge.text}</span>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Everything You Need to Succeed
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CLIENT_FEATURES.map((feature) => (
              <Card key={feature.title} hover>
                <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <Card>
            {FAQS.map((faq, i) => (
              <FAQItem
                key={i}
                {...faq}
                isOpen={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </Card>
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/20 via-red-900/10 to-dark-300 border border-gray-700 p-8 lg:p-12 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/10 rounded-full blur-2xl" />
          
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join 500+ professional dominatrices who trust DommeDirectory to grow their practice.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg">Create Free Profile</Button>
              <Button variant="outline" size="lg">Contact Sales</Button>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              No credit card required for free tier
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
