import React from 'react';

export interface BackgroundSuggestion {
  label: string;
  prompt: string;
}

export interface BackgroundSuggestionSubCategory {
    name: string;
    items: BackgroundSuggestion[];
}

export interface BackgroundSuggestionCategory {
  category: string;
  subCategories: BackgroundSuggestionSubCategory[];
}

interface BackgroundSuggestionsProps {
  suggestions: BackgroundSuggestionCategory[];
  onSelect: (prompt: string) => void;
}

const BackgroundSuggestions: React.FC<BackgroundSuggestionsProps> = ({ suggestions, onSelect }) => {
  return (
    <div className="mt-3 space-y-3">
      {suggestions.map((cat, catIndex) => (
        <details key={catIndex} className="bg-gray-800 border border-gray-700 rounded-lg open:bg-gray-700/50 transition-colors">
          <summary className="px-4 py-3 text-md font-semibold cursor-pointer text-gray-200 hover:text-white list-none flex justify-between items-center">
            {cat.category}
             <span className="text-gray-400 text-sm transform transition-transform duration-200 details-arrow">-&gt;</span>
          </summary>
          <div className="p-4 border-t border-gray-600 space-y-3">
            {cat.subCategories.map((subCat, subCatIndex) => (
              <div key={subCatIndex}>
                <h4 className="text-sm font-bold text-cyan-400 mb-2">{subCat.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {subCat.items.map((item, itemIndex) => (
                    <button
                      key={itemIndex}
                      onClick={() => onSelect(item.prompt)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-600 rounded-full hover:bg-cyan-600 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}
      <style>{`
        details > summary { -webkit-appearance: none; }
        details[open] > summary .details-arrow { transform: rotate(90deg); }
      `}</style>
    </div>
  );
};

export default BackgroundSuggestions;
