export default function Skeleton({
  className = '',
  circle = false,
  width,
  height,
  count = 1,
}) {
  const baseClasses = `
    animate-pulse
    bg-[#1f1f1f]
    ${circle ? 'rounded-full' : 'rounded-lg'}
    ${className}
  `;

  const style = {
    width: width,
    height: height,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={baseClasses}
          style={style}
        />
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
      <Skeleton className="w-full aspect-[3/4] rounded-lg mb-4" />
      <Skeleton className="h-5 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          width={i === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton circle width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
