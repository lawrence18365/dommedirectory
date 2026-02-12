import Tooltip from './Tooltip';

const tiers = {
  basic: {
    name: 'Verified',
    color: 'bg-blue-600',
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    description: 'Identity verified via government ID',
  },
  gold: {
    name: 'Gold Verified',
    color: 'bg-yellow-600',
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    description: 'Verified + Background check + Interview',
  },
  platinum: {
    name: 'Platinum',
    color: 'bg-red-600',
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    description: 'Elite tier: Verified + Premium member + Top rated',
  },
};

export default function VerificationBadge({ tier = 'basic', showTooltip = true, size = 'md' }) {
  const config = tiers[tier];
  
  const sizeClasses = {
    sm: 'h-5 px-1.5 text-[10px]',
    md: 'h-6 px-2 text-xs',
    lg: 'h-7 px-2.5 text-sm',
  };

  const badge = (
    <span className={`inline-flex items-center gap-1 ${config.color} text-white font-medium rounded-full ${sizeClasses[size]}`}>
      {config.icon}
      <span>{config.name}</span>
    </span>
  );

  if (showTooltip) {
    return (
      <Tooltip content={config.description}>
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
