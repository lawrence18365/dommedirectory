import { useState } from 'react';
import Layout from '../../components/layout/Layout';
import SEO from '../../components/ui/SEO';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import VerificationBadge from '../../components/ui/VerificationBadge';

const verificationSteps = [
  {
    id: 1,
    title: 'Identity Verification',
    description: 'Upload a government-issued ID to confirm legal identity',
    status: 'pending',
  },
  {
    id: 2,
    title: 'Proof of Control',
    description: 'Show profile ownership via live selfie/video with your handle',
    status: 'pending',
  },
  {
    id: 3,
    title: 'Trust & Safety Review',
    description: 'Manual review for policy compliance and moderation history',
    status: 'pending',
  },
  {
    id: 4,
    title: 'Pro Verification',
    description: 'Optional enhanced checks for Pro Verified placement',
    status: 'optional',
  },
];

const benefits = [
  {
    tier: 'basic',
    name: 'Basic Verified',
    price: 'Free',
    features: [
      'Identity verified badge',
      'Proof of profile control',
      'Standard search placement',
      'Basic trust indicators',
      'Access to messaging',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro Verified',
    price: 'Manual quote',
    features: [
      'Everything in Basic Verified',
      'Pro badge on profile',
      'Priority search placement',
      'Manual trust review',
      'Moderation priority',
      'Featured trust block on listing',
    ],
    popular: true,
  },
];

export default function Verification() {
  const [activeStep, setActiveStep] = useState(3);
  const [selectedTier, setSelectedTier] = useState('pro');

  return (
    <Layout>
      <SEO
        title="Verification - Trust and Safety"
        description="Get verified on DommeDirectory with Basic and Pro tiers built for legal, professional service trust."
      />

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-4">Trust & Safety</Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Get{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Verified
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Verification is a trust product: identity checks, profile-control proof, and moderation-backed safety.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Steps */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-white mb-6">Verification Process</h2>
              <div className="space-y-4">
                {verificationSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      step.status === 'completed'
                        ? 'bg-green-900/10 border-green-900/30'
                        : step.status === 'pending'
                        ? 'bg-red-600/10 border-red-600/30'
                        : 'bg-[#1f1f1f] border-gray-800'
                    }`}
                  >
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                      ${step.status === 'completed' ? 'bg-green-600/20' : ''}
                      ${step.status === 'pending' ? 'bg-red-600/20' : ''}
                      ${step.status === 'optional' ? 'bg-[#1a1a1a]' : ''}
                    `}>
                      {step.status === 'completed' ? (
                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-red-600 font-bold">{step.id}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold">{step.title}</h3>
                        {step.status === 'completed' && (
                          <Badge variant="success" size="sm">Done</Badge>
                        )}
                        {step.status === 'pending' && (
                          <Badge variant="primary" size="sm">Next</Badge>
                        )}
                        {step.status === 'optional' && (
                          <Badge variant="outline" size="sm">Optional</Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{step.description}</p>
                    </div>
                    {step.status === 'pending' && (
                      <Button size="sm">Start</Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Trust Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="text-center p-6">
                <div className="text-3xl font-black text-white mb-1">2</div>
                <p className="text-gray-500 text-sm">Verification Tiers</p>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-black text-white mb-1">1</div>
                <p className="text-gray-500 text-sm">Moderation Queue</p>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-black text-white mb-1">24h</div>
                <p className="text-gray-500 text-sm">Target review SLA</p>
              </Card>
            </div>
          </div>

          {/* Right Column - Tiers */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Choose Your Badge</h2>
            {benefits.map((tier) => (
              <Card
                key={tier.tier}
                className={`cursor-pointer transition-all ${
                  selectedTier === tier.tier ? 'ring-2 ring-red-600' : ''
                }`}
                onClick={() => setSelectedTier(tier.tier)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <VerificationBadge tier={tier.tier} size="sm" showTooltip={false} />
                      <h3 className="text-white font-semibold">{tier.name}</h3>
                    </div>
                    <p className="text-2xl font-bold text-white">{tier.price}</p>
                  </div>
                  {tier.popular && (
                    <Badge variant="primary" size="sm">Popular</Badge>
                  )}
                </div>
                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-400 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}

            <Button fullWidth size="lg">
              Start Verification
            </Button>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is my information secure?',
                a: 'Absolutely. We use bank-level encryption and never share your documents with third parties. All verification data is deleted after 30 days.',
              },
              {
                q: 'How long does verification take?',
                a: 'Basic and Pro reviews are processed through a moderation queue. Typical turnaround is 24-48 hours.',
              },
              {
                q: 'What if I fail verification?',
                a: 'You can resubmit with corrected documents. We include review notes so you know exactly what to fix.',
              },
            ].map((item, i) => (
              <Card key={i}>
                <h3 className="text-white font-semibold mb-2">{item.q}</h3>
                <p className="text-gray-400 text-sm">{item.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
