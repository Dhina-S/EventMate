import React from 'react';

const EventSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full animate-pulse">
      {/* Image Placeholder */}
      <div className="h-52 bg-gray-200 dark:bg-gray-700 relative">
        {/* Category tag skeleton */}
        <div className="absolute top-4 right-4 w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded-full" />
        {/* Price tag skeleton */}
        <div className="absolute bottom-4 left-4 w-14 h-7 bg-gray-300 dark:bg-gray-600 rounded-lg" />
      </div>

      {/* Content Placeholder */}
      <div className="p-5 flex flex-col flex-grow gap-3">
        {/* Date */}
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
        {/* Title */}
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full" />
        {/* Location */}
        <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-full mt-1" />
        {/* Button */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default EventSkeleton;
