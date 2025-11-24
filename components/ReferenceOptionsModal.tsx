import React, { useState, useEffect } from 'react';
import BackgroundSuggestions, { BackgroundSuggestionCategory } from './BackgroundSuggestions';

interface ReferenceOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (background: string, pose: string, style: string, usage: string) => void;
  initialBackground: string;
  initialPose: string;
  initialStyle: string;
  initialProductUsage?: string;
  backgroundSuggestions: BackgroundSuggestionCategory[];
  poseSuggestions: BackgroundSuggestionCategory[];
  styleSuggestions: BackgroundSuggestionCategory[];
  productUsageSuggestions?: BackgroundSuggestionCategory[];
  isBackgroundDisabled: boolean;
}

const ReferenceOptionsModal: React.FC<ReferenceOptionsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBackground,
  initialPose,
  initialStyle,
  initialProductUsage = '',
  backgroundSuggestions,
  poseSuggestions,
  styleSuggestions,
  productUsageSuggestions,
  isBackgroundDisabled,
}) => {
  const [background, setBackground] = useState(initialBackground);
  const [pose, setPose] = useState(initialPose);
  const [style, setStyle] = useState(initialStyle);
  const [productUsage, setProductUsage] = useState(initialProductUsage);

  useEffect(() => {
    if (isOpen) {
      setBackground(initialBackground);
      setPose(initialPose);
      setStyle(initialStyle);
      setProductUsage(initialProductUsage);
    }
  }, [isOpen, initialBackground, initialPose, initialStyle, initialProductUsage]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSave = () => {
    onSave(background, pose, style, productUsage);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 transition-opacity"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border-2 border-cyan-500/30">
        <div className="flex justify-between items-center p-5 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
            Tùy chọn Tham chiếu Nâng cao
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2 rounded-full transition-colors" aria-label="Đóng">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          {/* Background Reference Section */}
          <div>
            <label htmlFor="modal-background-ref-input" className="block text-lg font-semibold text-gray-200 mb-3">
              Tham chiếu Bối cảnh (Tùy chọn)
            </label>
            <input
              id="modal-background-ref-input"
              type="text"
              className="block w-full rounded-md bg-gray-800 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-3 disabled:opacity-50"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Ví dụ: quán cà phê, bãi biển..."
              disabled={isBackgroundDisabled}
            />
            {isBackgroundDisabled && <p className="mt-2 text-xs text-yellow-400">Tham chiếu bối cảnh bằng văn bản bị vô hiệu hóa khi sử dụng ảnh nền tham chiếu.</p>}
            <BackgroundSuggestions suggestions={backgroundSuggestions} onSelect={isBackgroundDisabled ? () => {} : setBackground} />
          </div>

          {/* Pose Reference Section */}
          <div>
            <label htmlFor="modal-pose-ref-input" className="block text-lg font-semibold text-gray-200 mb-3">
              Tham chiếu Dáng (Tùy chọn)
            </label>
            <input
              id="modal-pose-ref-input"
              type="text"
              className="block w-full rounded-md bg-gray-800 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-3"
              value={pose}
              onChange={(e) => setPose(e.target.value)}
              placeholder="Ví dụ: đang bước đi, tay trong túi quần..."
            />
            <BackgroundSuggestions suggestions={poseSuggestions} onSelect={setPose} />
          </div>

          {/* Style Reference Section */}
          <div>
            <label htmlFor="modal-style-ref-input" className="block text-lg font-semibold text-gray-200 mb-3">
              Phong cách & Chi tiết (Tùy chọn)
            </label>
            <input
              id="modal-style-ref-input"
              type="text"
              className="block w-full rounded-md bg-gray-800 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-3"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="Ví dụ: cinematic, golden hour lighting..."
            />
            <BackgroundSuggestions suggestions={styleSuggestions} onSelect={setStyle} />
          </div>

          {/* Product Usage Reference Section (Conditional) */}
          {productUsageSuggestions && (
            <div>
              <label htmlFor="modal-usage-ref-input" className="block text-lg font-semibold text-gray-200 mb-3">
                Cách nhân vật dùng sản phẩm (Tùy chọn)
              </label>
              <input
                id="modal-usage-ref-input"
                type="text"
                className="block w-full rounded-md bg-gray-800 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-3"
                value={productUsage}
                onChange={(e) => setProductUsage(e.target.value)}
                placeholder="Ví dụ: mặc lên người, cầm trên tay..."
              />
              <BackgroundSuggestions suggestions={productUsageSuggestions} onSelect={setProductUsage} />
            </div>
          )}
        </div>
        <div className="p-5 border-t border-gray-700 text-right bg-gray-800/50 rounded-b-xl flex-shrink-0">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 text-sm font-semibold rounded-lg shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-colors"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferenceOptionsModal;