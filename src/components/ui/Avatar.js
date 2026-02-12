const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
  '3xl': 'w-24 h-24 text-3xl',
};

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-500',
};

export default function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  statusPosition = 'bottom-right',
  border = false,
  className = '',
  ...props
}) {
  const initials = name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const statusPositionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  return (
    <div className={`relative inline-block ${className}`} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={`
            ${sizes[size]}
            rounded-full object-cover
            ${border ? 'ring-2 ring-red-600 ring-offset-2 ring-offset-dark-300' : ''}
          `}
        />
      ) : (
        <div
          className={`
            ${sizes[size]}
            rounded-full bg-gradient-to-br from-red-600 to-red-800
            flex items-center justify-center text-white font-semibold
            ${border ? 'ring-2 ring-red-600 ring-offset-2 ring-offset-dark-300' : ''}
          `}
        >
          {initials}
        </div>
      )}
      
      {status && (
        <span
          className={`
            absolute ${statusPositionClasses[statusPosition]}
            w-3 h-3 rounded-full ${statusColors[status]}
            ring-2 ring-dark-300
            ${size === 'xs' ? 'w-2 h-2' : ''}
            ${size === 'xl' || size === '2xl' || size === '3xl' ? 'w-4 h-4' : ''}
          `}
        />
      )}
    </div>
  );
}
