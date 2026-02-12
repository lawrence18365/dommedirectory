import Button from './Button';
import Badge from './Badge';

export default function PricingCard({
  tier,
  price,
  period = 'month',
  description,
  features,
  popular = false,
  ctaText = 'Get Started',
  onCtaClick,
  disabled = false,
}) {
  const tierStyles = {
    basic: 'border-gray-700',
    pro: 'border-red-600 shadow-lg shadow-red-600/20',
    elite: 'border-yellow-500/50 shadow-lg shadow-yellow-500/10',
  };

  const tierBadges = {
    basic: null,
    pro: <Badge variant="primary" className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>,
    elite: <Badge variant="warning" className="absolute -top-3 left-1/2 -translate-x-1/2">Best Value</Badge>,
  };

  return (
    <div className={`relative bg-[#1a1a1a] rounded-2xl border-2 p-6 ${tierStyles[tier]} ${popular ? 'scale-105 z-10' : ''}`}>
      {tierBadges[tier]}
      
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white capitalize mb-2">{tier}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      
      {/* Price */}
      <div className="text-center mb-6">
        <span className="text-4xl font-black text-white">${price}</span>
        <span className="text-gray-500">/{period}</span>
      </div>
      
      {/* Features */}
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      {/* CTA */}
      <Button
        variant={popular ? 'primary' : 'secondary'}
        fullWidth
        onClick={onCtaClick}
        disabled={disabled}
      >
        {ctaText}
      </Button>
    </div>
  );
}
