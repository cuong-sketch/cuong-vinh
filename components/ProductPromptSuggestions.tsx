
import React from 'react';
import type { BackgroundSuggestion } from './BackgroundSuggestions';

interface ProductPromptSuggestionsProps {
  suggestions: BackgroundSuggestion[];
  onSelect: (prompt: string) => void;
}

const ProductPromptSuggestions: React.FC<ProductPromptSuggestionsProps> = ({ suggestions, onSelect }) => {
  return (
    <div className="mt-3">
        <p className="text-xs text-gray-400 mb-2">Gợi ý nhanh cho câu lệnh tách nền:</p>
        <div className="flex flex-wrap gap-2">
            {suggestions.map((item, itemIndex) => (
            <button
                key={itemIndex}
                onClick={() => onSelect(item.prompt)}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-600 rounded-full hover:bg-cyan-600 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                title={item.prompt}
            >
                {item.label}
            </button>
            ))}
        </div>
    </div>
  );
};

export default ProductPromptSuggestions;
