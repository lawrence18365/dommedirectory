import AnimatedCounter from './AnimatedCounter';
import Tooltip from './Tooltip';

export default function StatCard({
  title,
  value,
  suffix = '',
  prefix = '',
  change,
  changeType = 'neutral',
  icon,
  trend,
  description,
  loading = false,
}) {
  const changeColors = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
  };

  const changeIcons = {
    positive: '↑',
    negative: '↓',
    neutral: '→',
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-5 animate-pulse">
        <div className="h-4 bg-[#1f1f1f] rounded w-24 mb-4" />
        <div className="h-8 bg-[#1f1f1f] rounded w-16" />
      </div>
    );
  }

  const content = (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-5 hover:border-red-600/30 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">
              <AnimatedCounter end={value} prefix={prefix} suffix={suffix} />
            </span>
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${changeColors[changeType]}`}>
              <span>{changeIcons[changeType]}</span>
              <span>{Math.abs(change)}%</span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center text-red-600">
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-4 h-10">
          {/* Simple sparkline visualization */}
          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path
              d={trend}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={changeType === 'positive' ? 'text-green-500' : 'text-red-600'}
            />
          </svg>
        </div>
      )}
    </div>
  );

  if (description) {
    return (
      <Tooltip content={description}>
        {content}
      </Tooltip>
    );
  }

  return content;
}

// Mini stat for compact displays
export function MiniStat({ label, value, icon, trend }) {
  return (
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center text-red-600">
          {icon}
        </div>
      )}
      <div>
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="text-white font-semibold">{value}</p>
      </div>
      {trend && (
        <span className={`text-xs ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  );
}

// Stats Grid
export function StatsGrid({ children, columns = 4 }) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {children}
    </div>
  );
}
