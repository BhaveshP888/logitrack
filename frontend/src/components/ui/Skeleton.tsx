
interface SkeletonProps {
  className?: string;
  count?: number;
}

export default function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <div className="flex flex-col gap-3 w-full" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={`bg-white/[0.03] animate-pulse rounded-lg ${className}`}
        ></div>
      ))}
    </div>
  );
}
