import { useState, createContext, useContext } from 'react';

const TabsContext = createContext(null);

export function Tabs({ children, defaultIndex = 0, className = '' }) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  return (
    <TabsContext.Provider value={{ activeIndex, setActiveIndex }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, className = '', variant = 'default' }) {
  const variants = {
    default: 'flex gap-1 p-1 bg-[#1f1f1f] rounded-lg',
    pills: 'flex flex-wrap gap-2',
    underline: 'flex gap-6 border-b border-gray-700',
  };

  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function Tab({ children, index, className = '', variant = 'default' }) {
  const { activeIndex, setActiveIndex } = useContext(TabsContext);
  const isActive = activeIndex === index;

  const variants = {
    default: `
      flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all
      ${isActive 
        ? 'bg-red-600 text-white shadow-sm' 
        : 'text-gray-400 hover:text-white hover:bg-red-600/20'
      }
    `,
    pills: `
      px-4 py-2 text-sm font-medium rounded-full border transition-all
      ${isActive
        ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
        : 'bg-[#1a1a1a] text-gray-400 border-gray-800 hover:border-red-600/30'
      }
    `,
    underline: `
      px-1 py-3 text-sm font-medium border-b-2 transition-all
      ${isActive
        ? 'text-red-600 border-red-600'
        : 'text-gray-500 border-transparent hover:text-gray-300'
      }
    `,
  };

  return (
    <button
      className={`${variants[variant]} ${className}`}
      onClick={() => setActiveIndex(index)}
    >
      {children}
    </button>
  );
}

export function TabPanel({ children, index, className = '' }) {
  const { activeIndex } = useContext(TabsContext);
  
  if (activeIndex !== index) return null;

  return (
    <div className={`animate-fadeIn ${className}`}>
      {children}
    </div>
  );
}
