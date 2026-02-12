import Link from 'next/link';

const variants = {
  primary: 'bg-red-600 hover:bg-red-600 text-white border-transparent shadow-lg shadow-red-600/20',
  secondary: 'bg-[#1a1a1a] hover:bg-[#1f1f1f] text-white border-gray-700',
  outline: 'bg-transparent hover:bg-red-600/20 text-red-600 border-red-600/30 hover:border-red-600',
  ghost: 'bg-transparent hover:bg-red-600/10 text-gray-300 hover:text-white border-transparent',
  danger: 'bg-red-600 hover:bg-red-500 text-white border-transparent',
  success: 'bg-green-600 hover:bg-green-500 text-white border-transparent',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  xl: 'h-14 px-8 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-lg
    border transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-red-500/30
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none
    active:scale-95
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  const content = (
    <>
      {isLoading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={baseClasses}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}
