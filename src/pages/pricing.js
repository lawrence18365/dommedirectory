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
    period: '',
    description: 'Launch a compliant profile',
    features: [
      'Professional profile listing',
      'Up to 5 photos',
      'City and profile discoverability',
      'Basic trust indicators',
      'Lead actions tracking (7 days)',
      'Email support',
    ],
    ctaText: 'Start Free',
  },
  {
    tier: 'pro',
    price: 'Request Quote',
    period: '',
    description: 'Lead growth add-on (manual billing)',
    features: [
      'Everything in Basic',
      'Featured city/category placement',
      '30-day lead funnel analytics',
      'Priority moderation support',
      'Pro verification review',
      'Custom booking link',
      'Founding provider showcase eligibility',
    ],
    popular: true,
    ctaText: 'Apply for Pro',
  },
  {
    tier: 'elite',
    price: 'Custom',
    period: '',
    description: 'Metro-level expansion package',
    features: [
      'Everything in Pro',
      'Multi-city featured placements',
      'Dedicated onboarding support',
      'Advanced provider referral tools',
      'Quarterly trust & conversion review',
      'Custom reporting exports',
    ],
    ctaText: 'Contact Sales',
  },
];

const CLIENT_FEATURES = [
  {
    title: 'Buyer-Intent Search',
    description: 'Find legal professional services by city and service focus',
  },
  {
    title: 'Verification Tiers',
    description: 'Understand whether a provider is Basic Verified or Pro Verified',
  },
  {
    title: 'Safety First',
    description: 'Clear reporting flows, moderation, and transparent trust blocks',
  },
  {
    title: 'Trackable Outcomes',
    description: 'Providers can measure profile views, CTA clicks, and contact actions',
  },
  {
    title: 'Professional Positioning',
    description: 'Public pages stay professional and policy-compliant',
  },
  {
    title: 'Manual Quality Control',
    description: 'Founding providers are onboarded with direct review and feedback',
  },
];

const FAQS = [
  {
    question: 'How does DommeDirectory make money right now?',
    answer: 'Current revenue is manual: featured placement, verification services, and analytics add-ons. We only charge when lead flow is proven.',
  },
  {
    question: 'Is my privacy protected?',
    answer: 'Yes. We limit sensitive data exposure, use strict moderation workflows, and keep provider trust/safety controls visible on listings.',
  },
  {
    question: 'How does verification work?',
    answer: 'Basic Verified confirms identity and profile control. Pro Verified adds enhanced checks and manual review for trust-sensitive placement.',
  },
  {
    question: 'How fast is onboarding?',
    answer: 'Founding providers are onboarded manually with a short review queue. We optimize for quality and safety over volume.',
  },
  {
    question: 'What payment methods are supported?',
    answer: 'Phase 1 uses manual billing only while we finalize an adult-compatible payment workflow for automation.',
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
    showToast(`Application started for ${tier}. Our team will follow up for manual onboarding.`, 'info');
  };

  return (
    <Layout>
      <SEO
        title="Pricing - DommeDirectory Provider Plans"
        description="Start with a compliant listing and upgrade through manual, performance-driven provider plans."
      />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Simple Pricing</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Build Your{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Lead Engine
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Start focused in one metro, prove lead flow, then scale with trust-first upgrades.
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
            { text: 'Legal-only policy enforcement' },
            { text: 'Identity + control verification' },
            { text: 'Trackable inquiry actions' },
            { text: 'Human moderation queue' },
            { text: 'Manual quality onboarding' },
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
              Ready to Become a Founding Provider?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Get verified, complete your profile, and start receiving measurable city-intent inquiries.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg">Create Free Profile</Button>
              <Button variant="outline" size="lg">Apply for Featured Placement</Button>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              Manual billing only during the founding phase
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
