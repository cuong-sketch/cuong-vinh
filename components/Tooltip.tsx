import React, { useState } from 'react';
import { HelpIcon } from './icons';

interface TooltipProps {
  content: React.ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, className }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative flex items-center ${className}`} 
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <HelpIcon className="w-4 h-4 text-gray-400 hover:text-cyan-400 cursor-help" />
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-gray-600 text-gray-200 text-xs rounded-lg shadow-lg z-50 pointer-events-none">
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
