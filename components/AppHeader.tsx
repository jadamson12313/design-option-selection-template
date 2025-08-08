import React from 'react';

export function AppHeader() {
  return (
    <div className="w-full bg-background border-b p-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl">Design Option Selection</h1>
          <div className="bg-blue-100 border border-blue-300 rounded px-3 py-1 text-sm text-blue-700">
            Ready for Development
          </div>
        </div>
      </div>
    </div>
  );
}