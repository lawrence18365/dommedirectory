export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  elevated = false,
  border = true,
  onClick,
  ...props
}) {
  const paddingSizes = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  return (
    <div
      className={`
        bg-[#1a1a1a] rounded-xl
        ${border ? 'border border-gray-800' : ''}
        ${elevated ? 'shadow-lg shadow-black/20' : ''}
        ${hover ? 'hover:border-red-600/30 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 cursor-pointer' : ''}
        ${paddingSizes[padding]}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', action }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex-1">{children}</div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-bold text-white ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-gray-500 mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-800 ${className}`}>
      {children}
    </div>
  );
}
