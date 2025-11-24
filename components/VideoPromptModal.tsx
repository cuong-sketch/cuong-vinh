import React, { useState } from 'react';
import { StoryScene } from '../types';
import { SparklesIcon, SpinnerIcon, CopyIcon, DownloadIcon } from './icons';

export interface DisplayScene extends StoryScene {
  startImageSrc?: string;
  endImageSrc?: string;
}

interface VideoPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: DisplayScene[];
  onGeneratePrompts: () => Promise<void>;
  onUpdateScenePrompt: (sceneDescription: string, newPrompt: string) => void;
  isGenerating: boolean;
  onDownloadPrompt: (content: string, filename: string) => void;
  storyName: string;
  onDownloadAll: (scenes: DisplayScene[]) => void;
  videoPromptStructure: string;
  onVideoPromptStructureChange: (value: string) => void;
}

const ScenePrompt: React.FC<{
    scene: DisplayScene;
    sceneNumber: number;
    onUpdateScenePrompt: (sceneDescription: string, newPrompt: string) => void;
    isGenerating: boolean;
    onDownloadPrompt: (content: string, filename: string) => void;
    storyName: string;
}> = ({ scene, sceneNumber, onUpdateScenePrompt, isGenerating, onDownloadPrompt, storyName }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (scene.videoPrompt) {
            navigator.clipboard.writeText(scene.videoPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (scene.videoPrompt) {
            const safeStoryName = storyName.replace(/[<>:"/\\|?*]+/g, '').split(' ').slice(0, 5).join(' ');
            const filename = `${safeStoryName || 'Cau Chuyen'} - Cảnh ${sceneNumber}.txt`;
            onDownloadPrompt(scene.videoPrompt, filename);
        }
    };
    
    return (
        <div className="p-4 bg-[#101729] border border-gray-700 rounded-lg flex gap-4 items-stretch">
            <div className="w-1/3 flex-shrink-0 flex gap-2">
                <div className="w-1/2">
                   {scene.startImageSrc && <img src={scene.startImageSrc} alt={`Cảnh ${sceneNumber} Bắt đầu`} className="w-full h-full object-cover rounded-md" />}
                </div>
                <div className="w-1/2">
                    {scene.endImageSrc && <img src={scene.endImageSrc} alt={`Cảnh ${sceneNumber} Kết thúc`} className="w-full h-full object-cover rounded-md" />}
                </div>
            </div>
            <div className="flex-1 relative">
                 <p className="text-sm font-semibold text-gray-300 mb-2">Prompt cho Cảnh {sceneNumber}</p>
                 <textarea
                    rows={6}
                    className="block w-full h-full rounded-md bg-[#090E1A] border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 resize-none"
                    value={scene.videoPrompt || ''}
                    onChange={(e) => onUpdateScenePrompt(scene.scene, e.target.value)}
                    placeholder="Prompt video sẽ được tạo ở đây..."
                    disabled={isGenerating}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                    <button
                        onClick={handleDownload}
                        disabled={!scene.videoPrompt}
                        className="p-1.5 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title={"Tải prompt"}
                    >
                        <DownloadIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={!scene.videoPrompt}
                        className="p-1.5 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title={copied ? "Đã sao chép!" : "Sao chép"}
                    >
                        <CopyIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};


const VideoPromptModal: React.FC<VideoPromptModalProps> = ({
  isOpen,
  onClose,
  scenes,
  onGeneratePrompts,
  onUpdateScenePrompt,
  isGenerating,
  onDownloadPrompt,
  storyName,
  onDownloadAll,
  videoPromptStructure,
  onVideoPromptStructureChange,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 transition-opacity"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-[#090E1A] rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col border-2 border-indigo-500/30">
        <div className="flex justify-between items-center p-5 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-200">
            Gợi ý Prompt Video
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2 rounded-full transition-colors" aria-label="Đóng">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <p className="text-sm text-gray-400">Xem lại các cảnh và prompt. Các prompt này sẽ được dùng để tạo video cho từng cảnh tương ứng.</p>
          {scenes.map((scene, index) => (
            <ScenePrompt 
                key={index}
                scene={scene}
                sceneNumber={index + 1}
                onUpdateScenePrompt={onUpdateScenePrompt}
                isGenerating={isGenerating}
                onDownloadPrompt={onDownloadPrompt}
                storyName={storyName}
            />
          ))}
          <details className="bg-gray-900/30 border border-gray-700 rounded-lg transition-colors p-1">
               <summary className="px-4 py-3 text-sm font-semibold cursor-pointer text-gray-300 hover:text-white list-none flex justify-between items-center">Cấu trúc Prompt (Nâng cao)</summary>
               <div className="p-4 border-t border-gray-600 space-y-4">
                  <div>
                    <label htmlFor="prompt-structure-input" className="block text-sm font-medium text-gray-300 mb-2">Chỉnh sửa chỉ dẫn gốc cho AI</label>
                    <textarea 
                        id="prompt-structure-input" 
                        rows={15} 
                        className="block w-full rounded-md bg-gray-800 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-300 p-2 font-mono text-xs" 
                        value={videoPromptStructure} 
                        onChange={(e) => onVideoPromptStructureChange(e.target.value)}
                        placeholder="Dán cấu trúc prompt tại đây..."
                        disabled={isGenerating}
                    />
                     <p className="mt-2 text-xs text-gray-400">Đây là chỉ dẫn hệ thống được gửi đến AI để tạo prompt. Bạn có thể chỉnh sửa nó để thay đổi kết quả. Mọi thay đổi sẽ được lưu tự động.</p>
                  </div>
              </div>
            </details>
        </div>
        <div className="p-4 border-t border-gray-700 bg-[#101729]/50 rounded-b-xl flex-shrink-0 flex justify-between items-center gap-4">
            <div>
                 <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                    Hủy
                </button>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => onDownloadAll(scenes)}
                    disabled={isGenerating || scenes.some(s => !s.videoPrompt)}
                    className="px-5 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    <DownloadIcon className="w-5 h-5" />
                    Tải về Tất cả
                </button>
                 <button
                    onClick={onGeneratePrompts}
                    disabled={isGenerating}
                    className="px-5 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-lg shadow-sm text-white bg-gray-600 hover:bg-gray-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    AI Gợi ý Prompts
                </button>
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-sm font-semibold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                    Xong
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPromptModal;