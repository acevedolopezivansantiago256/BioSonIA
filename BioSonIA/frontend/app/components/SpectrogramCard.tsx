"use client";
import React, { useState } from 'react';

interface SpectrogramCardProps {
  title: string;
  imageSrc: string | null;
  altText: string;
}

export default function SpectrogramCard({ title, imageSrc, altText }: SpectrogramCardProps) {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1));
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setZoom(1); // Reset zoom when toggling view
  };

  if (!imageSrc) {
    return (
      <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-full">
         <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
           <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{title}</h3>
         </div>
         <div className="p-10 flex flex-col items-center justify-center text-slate-400 min-h-[250px]">
            <span className="material-symbols-rounded text-4xl mb-2">image_not_supported</span>
            <p className="text-xs font-bold uppercase tracking-wider">No Data</p>
         </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h3>
          <div className="flex gap-2">
            <button 
              onClick={handleZoomIn} 
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-primary" 
              title="Zoom In"
            >
              <span className="material-symbols-rounded text-lg">zoom_in</span>
            </button>
            <button 
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-primary" 
              title="Zoom Out"
            >
              <span className="material-symbols-rounded text-lg">zoom_out</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
            <button 
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-primary" 
              title="Enlarge"
            >
              <span className="material-symbols-rounded text-lg">open_in_full</span>
            </button>
          </div>
        </div>
        <div className="p-0 bg-white dark:bg-slate-900 overflow-hidden relative group flex-1 min-h-[250px]">
           <div className="w-full h-full overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-950/50">
             <img 
               src={imageSrc} 
               alt={altText} 
               className="transition-transform duration-300 ease-out object-contain max-h-full w-full"
               style={{ transform: `scale(${zoom})`, cursor: zoom > 1 ? 'grab' : 'default' }}
             />
           </div>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center p-6 text-white">
             <h2 className="text-lg font-bold">{title} - Full View</h2>
             <div className="flex gap-4 items-center">
                 <div className="flex bg-white/10 rounded-lg p-1">
                    <button onClick={handleZoomOut} className="p-2 hover:bg-white/20 rounded-md"><span className="material-symbols-rounded">remove</span></button>
                    <span className="px-3 flex items-center font-mono text-sm">{Math.round(zoom * 100)}%</span>
                    <button onClick={handleZoomIn} className="p-2 hover:bg-white/20 rounded-md"><span className="material-symbols-rounded">add</span></button>
                 </div>
                 <button 
                    onClick={toggleFullscreen} 
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                 >
                    <span className="material-symbols-rounded text-3xl">close</span>
                 </button>
             </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
             <img 
               src={imageSrc} 
               alt={altText} 
               className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-200"
               style={{ transform: `scale(${zoom})` }}
             />
          </div>
        </div>
      )}
    </>
  );
}
