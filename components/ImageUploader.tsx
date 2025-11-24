
import React, { useRef } from 'react';
import { UploadIcon, SparklesIcon } from './icons';

interface ImageUploaderProps {
  id: string;
  onImageUpload: (files: FileList) => void;
  label: string;
  multiple?: boolean;
  disabled?: boolean;
  previewSrc?: string | null;
  containerClassName?: string;
  onPreviewClick?: () => void;
  onSelectFromGallery?: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, onImageUpload, label, multiple = false, disabled = false, previewSrc = null, containerClassName, onPreviewClick, onSelectFromGallery }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onImageUpload(event.target.files);
    }
     // Reset input value to allow re-uploading the same file
    if(event.target) {
        event.target.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onImageUpload(event.dataTransfer.files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const baseClassName = `relative flex flex-col items-center justify-center w-full border-2 border-gray-600 border-dashed rounded-lg ${containerClassName || 'h-48'} ${disabled ? 'bg-gray-800 opacity-50' : 'bg-gray-800 hover:bg-gray-700'} transition-colors overflow-hidden`;

  return (
    <div className="w-full">
      {previewSrc && onPreviewClick && !disabled ? (
         <div 
            className={`${baseClassName} p-0 cursor-pointer`}
            onClick={onPreviewClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            role="button"
            aria-label={`Xem ảnh ${label}`}
         >
            <img src={previewSrc} alt="Preview" className="h-full w-full object-contain" />
         </div>
      ) : (
        <label
            htmlFor={id}
            className={`${baseClassName} ${!previewSrc ? (disabled ? 'cursor-not-allowed' : 'cursor-pointer') : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {previewSrc ? (
            <img src={previewSrc} alt="Preview" className="h-full w-full object-contain" />
            ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
                <UploadIcon className="w-8 h-8 text-gray-500 mb-2" />
                <p className="mb-1 text-xs text-gray-400"><span className="font-semibold">Nhấn để tải lên</span> hoặc kéo và thả</p>
                <p className="text-[10px] leading-tight text-gray-500">{label}</p>
            </div>
            )}
            
            <input
              id={id}
              ref={inputRef}
              type="file"
              multiple={multiple}
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              disabled={disabled}
            />
        </label>
      )}
      {onSelectFromGallery && (
        <button
          onClick={onSelectFromGallery}
          disabled={disabled}
          type="button"
          className="mt-2 w-full inline-flex items-center justify-center gap-2 text-center py-2 px-4 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
        >
          <SparklesIcon className="w-4 h-4" />
          Chọn từ Thư viện
        </button>
      )}
    </div>
  );
};

export default ImageUploader;
