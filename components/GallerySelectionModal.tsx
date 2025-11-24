
import React, { useState } from 'react';
import type { GeneratedImage } from '../types';

interface GallerySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSrcs: string[]) => void;
  images: GeneratedImage[];
  multiple: boolean;
  title: string;
}

const GallerySelectionModal: React.FC<GallerySelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  images,
  multiple,
  title,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelect = (image: GeneratedImage) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev);
      if (multiple) {
        if (newSelection.has(image.id)) {
          newSelection.delete(image.id);
        } else {
          newSelection.add(image.id);
        }
      } else {
        newSelection.clear();
        newSelection.add(image.id);
      }
      return newSelection;
    });
  };

  const handleConfirm = () => {
    const selectedImages = images.filter(img => selectedIds.has(img.id));
    // The gallery shows the latest images first (reversed), so we want to maintain that order.
    // The filter preserves the original `images` array order.
    onConfirm(selectedImages.map(img => img.src));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 transition-opacity"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-slate-900 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col border-2 border-indigo-500/30">
        <div className="flex justify-between items-center p-5 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2 rounded-full transition-colors" aria-label="Đóng">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map(image => (
                <div
                  key={image.id}
                  className="relative group aspect-[9/16] w-full cursor-pointer"
                  onClick={() => handleSelect(image)}
                >
                  <img
                    src={image.src}
                    alt="Generated creation"
                    className="w-full h-full object-cover rounded-lg border-2 border-transparent"
                  />
                  {/* Fix: Corrected corrupted className and completed the component structure. */}
                  <div 
                      className={`absolute inset-0 rounded-lg transition-all pointer-events-none ${selectedIds.has(image.id) ? 'border-4 border-cyan-500' : 'border-4 border-transparent'} group-hover:border-4 group-hover:border-cyan-500/50`}
                  ></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-gray-500 p-4 border-2 border-dashed border-gray-700 rounded-lg h-full">
              <p>Thư viện trống.</p>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-gray-700 bg-gray-800/50 rounded-b-xl flex-shrink-0 flex justify-end gap-4">
            <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-semibold rounded-lg shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
            >
                Hủy
            </button>
            <button
                onClick={handleConfirm}
                disabled={selectedIds.size === 0}
                className="px-6 py-2.5 text-sm font-semibold rounded-lg shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                Xác nhận ({selectedIds.size})
            </button>
        </div>
      </div>
    </div>
  );
};

// Fix: Add missing default export
export default GallerySelectionModal;
