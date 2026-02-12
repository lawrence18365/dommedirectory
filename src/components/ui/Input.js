import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            block w-full h-11
            bg-[#141414] text-white placeholder-gray-500
            border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600/50
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${leftIcon ? 'pl-10' : 'pl-4'}
            ${rightIcon ? 'pr-10' : 'pr-4'}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-700 hover:border-gray-600'}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
