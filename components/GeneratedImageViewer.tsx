
import React from 'react';
import { DownloadIcon, SparklesIcon, RegenerateIcon } from './icons';

interface GeneratedImageViewerProps {
  imageSrc: string | null;
  onDownload: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  progressMessage?: string;
  error?: string | null;
}

const GeneratedImageViewer: React.FC<GeneratedImageViewerProps> = ({
  imageSrc,
  onDownload,
  onRegenerate,
  isLoading,
  progressMessage,
  error,
}) => {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full aspect-[9/16] bg-gray-800 rounded-lg border-2 border-gray-700 flex items-center justify-center overflow-hidden mb-4">
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10 p-4">
            <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-white text-center">{progressMessage || 'Đang tạo cảnh của bạn...'}</p>
          </div>
        )}
        {imageSrc ? (
          <img src={imageSrc} alt="Image viewer" className="object-contain h-full w-full" />
        ) : (
          <div className="text-center text-gray-500 p-4">
            <SparklesIcon className="w-16 h-16 mx-auto mb-4" />
            <p>Nhấp vào một ảnh bất kỳ để xem tại đây</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-center whitespace-pre-wrap mb-4 w-full">{error}</p>}
      
      <div className="w-full flex items-center gap-4">
          <button
              onClick={onDownload}
              disabled={!imageSrc || isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
              <DownloadIcon className="w-5 h-5" />
              Tải Ảnh Này
          </button>
           <button
                onClick={onRegenerate}
                disabled={!imageSrc || isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                <RegenerateIcon className="w-5 h-5" />
                Tạo Lại Ảnh Này
            </button>
      </div>
    </div>
  );
};

export default GeneratedImageViewer;
