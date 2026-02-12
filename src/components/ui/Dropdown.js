import { useState, useRef, useEffect } from 'react';

export default function Dropdown({
  trigger,
  children,
  align = 'left',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 min-w-[200px]
            bg-[#1a1a1a] rounded-xl border border-gray-700
            shadow-xl shadow-black/40
            animate-scaleIn
            ${alignClasses[align]}
            ${className}
          `}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  icon,
  onClick,
  danger = false,
  disabled = false,
  className = '',
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5 text-sm
        transition-colors
        ${danger 
          ? 'text-red-400 hover:bg-red-900/20' 
          : 'text-gray-300 hover:bg-red-600/20 hover:text-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        first:rounded-t-xl last:rounded-b-xl
        ${className}
      `}
    >
      {icon && <span className="text-gray-500">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-gray-800" />;
}

export function DropdownHeader({ children }) {
  return (
    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </div>
  );
}
