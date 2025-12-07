import { Skeleton } from '@/components/ui/skeleton';

export const MessageSkeleton = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* User message skeleton */}
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%]">
          <Skeleton className="h-12 w-64 rounded-[18px] rounded-br-[4px]" />
        </div>
      </div>
      
      {/* AI message skeleton */}
      <div className="flex justify-start mb-4">
        <div className="flex gap-2">
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-24 w-80 rounded-[18px] rounded-bl-[4px]" />
          </div>
        </div>
      </div>
      
      {/* Another user message skeleton */}
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%]">
          <Skeleton className="h-10 w-48 rounded-[18px] rounded-br-[4px]" />
        </div>
      </div>
      
      {/* Another AI message skeleton */}
      <div className="flex justify-start mb-4">
        <div className="flex gap-2">
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-32 w-96 rounded-[18px] rounded-bl-[4px]" />
          </div>
        </div>
      </div>
    </div>
  );
};
