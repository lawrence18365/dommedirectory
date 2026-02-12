const variants = {
  default: 'bg-[#1f1f1f] text-gray-300 border-gray-700',
  primary: 'bg-red-600 text-white border-red-600',
  success: 'bg-green-600/20 text-green-400 border-green-600/30',
  warning: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
  error: 'bg-red-600/20 text-red-400 border-red-600/30',
  info: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  verified: 'bg-red-600 text-white border-red-600',
  online: 'bg-green-500/20 text-green-400 border-green-500/30',
  outline: 'bg-transparent text-red-600 border-red-600/50',
  ghost: 'bg-transparent text-gray-400 border-transparent',
};

const sizes = {
  sm: 'h-5 px-1.5 text-[10px]',
  md: 'h-6 px-2.5 text-xs',
  lg: 'h-7 px-3 text-sm',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
  dotColor = 'currentColor',
  icon,
  ...props
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium rounded-full border
        transition-colors
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {icon}
      {children}
    </span>
  );
}
