// src/components/SkeletonDashboard.jsx
import React from 'react';

const SkeletonDashboard = () => {
  return (
    <div className="bg-gray-50 min-h-screen pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
        <div className="container mx-auto">
          <div className="h-8 bg-blue-400 rounded w-2/3 mb-2"></div>
          <div className="h-6 bg-blue-400 rounded w-1/2 opacity-70"></div>
        </div>
      </div>
      
      {/* Main Content Skeleton */}
      <div className="container mx-auto py-8 px-4">
        {/* Quick Actions Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-12 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
        
        {/* Career Path Matches Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-6"></div>
          
          {/* Bar Chart Skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="mb-4">
                <div className="flex justify-between mb-2">
                  <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-300 rounded w-16"></div>
                </div>
                <div className="relative h-8 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full rounded-full bg-gray-300" 
                    style={{ width: `${70 - (item * 15)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {/* User Profile Summary Skeleton */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <div className="h-7 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="mb-4">
                    <div className="h-4 bg-gray-300 rounded w-1/4 mb-1"></div>
                    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
              <div>
                {[1, 2, 3].map((item) => (
                  <div key={item} className="mb-4">
                    <div className="h-4 bg-gray-300 rounded w-1/4 mb-1"></div>
                    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Complete Analysis Text Skeleton */}
          <div>
            <div className="h-7 bg-gray-300 rounded w-1/3 mb-6"></div>
            
            {/* Multiple line paragraphs */}
            {[1, 2, 3].map((section) => (
              <div key={section} className="mb-8">
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                
                {[1, 2, 3, 4].map((paragraph) => (
                  <div key={paragraph} className="mb-4">
                    <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-11/12 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                  </div>
                ))}
                
                {/* Bullet points */}
                {[1, 2, 3].map((bullet) => (
                  <div key={bullet} className="flex mb-3">
                    <div className="h-4 w-4 rounded-full bg-gray-300 mr-2 mt-1"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-full mb-1"></div>
                      <div className="h-4 bg-gray-300 rounded w-11/12"></div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonDashboard;
