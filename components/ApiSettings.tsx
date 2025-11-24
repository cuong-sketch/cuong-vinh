
import React, { useState, useEffect } from 'react';

interface ApiSettingsProps {
    apiKeys: string[];
    maxConcurrency: number;
    onSave: (keys: string[], concurrency: number) => void;
    useDefaultApiKey: boolean;
    onUseDefaultApiKeyChange: (useDefault: boolean) => void;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({ apiKeys, maxConcurrency, onSave, useDefaultApiKey, onUseDefaultApiKeyChange }) => {
    const [keysInput, setKeysInput] = useState('');
    const [concurrencyInput, setConcurrencyInput] = useState(maxConcurrency);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // Initialize state from props when component mounts or props change
        setKeysInput(apiKeys.join('\n'));
        setConcurrencyInput(maxConcurrency);
    }, [apiKeys, maxConcurrency]);


    const handleSave = () => {
        const newKeys = keysInput.split('\n').map(k => k.trim()).filter(Boolean);
        onSave(newKeys, concurrencyInput);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000); // Hide message after 2 seconds
    };

    const handleConcurrencyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value > 0) {
            setConcurrencyInput(value);
        }
    };

    const isCustomDisabled = useDefaultApiKey;

    return (
        <div className="max-w-3xl mx-auto p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Quản lý API Keys & Cài đặt</h2>

            <div className="mb-6 flex items-center p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                <input
                    id="use-default-api-key"
                    type="checkbox"
                    checked={useDefaultApiKey}
                    onChange={(e) => onUseDefaultApiKeyChange(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-500 bg-gray-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <label
                    htmlFor="use-default-api-key"
                    className="ml-3 block text-sm font-medium text-gray-200 select-none cursor-pointer"
                >
                    Sử dụng API Key mặc định (nếu có)
                </label>
            </div>

            <fieldset disabled={isCustomDisabled} className="space-y-8 disabled:opacity-50 transition-opacity">
                <div>
                    <label htmlFor="api-keys-textarea" className="block text-sm font-medium text-gray-300 mb-2">
                        Danh sách API Keys (mỗi key một dòng)
                    </label>
                    <textarea
                        id="api-keys-textarea"
                        rows={8}
                        value={keysInput}
                        onChange={(e) => setKeysInput(e.target.value)}
                        placeholder="Dán các API Key của bạn vào đây, mỗi key trên một dòng riêng biệt."
                        className="block w-full rounded-md bg-gray-700 border-gray-600 focus:border-amber-500 focus:ring-amber-500 sm:text-sm text-gray-100 p-2 font-mono"
                    />
                     <p className="mt-2 text-xs text-gray-400">
                        Toàn bộ nội dung trong ô này sẽ được lưu lại. Xóa một dòng để gỡ bỏ key.
                    </p>
                </div>

                <div>
                    <label htmlFor="max-concurrency" className="block text-sm font-medium text-gray-300 mb-2">Số lượng yêu cầu đồng thời trên mỗi Key</label>
                    <input
                        id="max-concurrency"
                        type="number"
                        min="1"
                        value={concurrencyInput}
                        onChange={handleConcurrencyInputChange}
                        className="block w-32 rounded-md bg-gray-700 border-gray-600 focus:border-amber-500 focus:ring-amber-500 sm:text-sm text-gray-100 p-2"
                    />
                     <p className="mt-2 text-xs text-gray-400">
                        Giá trị này xác định số lượng ảnh có thể được xử lý song song cho mỗi API Key.
                    </p>
                </div>
            </fieldset>
            
            <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Thông tin Giới hạn API (Tham khảo)</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Các giới hạn này được áp dụng cho mỗi API Key và mỗi project. Việc cài đặt "yêu cầu đồng thời" quá cao có thể dẫn đến lỗi. Khi một key bị giới hạn, hệ thống sẽ tự động chuyển sang key tiếp theo.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-2">
                    <li>
                        <span className="font-semibold text-amber-400">Gemini 2.5 Flash Image:</span>
                        <ul className="list-['-_'] list-inside ml-6 mt-1 text-gray-400">
                            <li><span className="font-medium text-gray-200">60 yêu cầu / phút</span> (RPM - Requests Per Minute)</li>
                            <li>Đây là model được sử dụng cho cả tách nền và tạo cảnh trong ứng dụng này.</li>
                        </ul>
                    </li>
                </ul>
                <p className="mt-4 text-xs text-gray-500">
                    Lưu ý: Các giới hạn này có thể thay đổi. Vui lòng tham khảo tài liệu chính thức của Google AI để có thông tin mới nhất.
                </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
                 <button
                    onClick={handleSave}
                    disabled={isCustomDisabled}
                    className="px-6 py-2 rounded-md font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Lưu Cài Đặt
                </button>
                {saved && !isCustomDisabled && (
                    <span className="text-green-400 text-sm transition-opacity duration-300">
                        Đã lưu thành công!
                    </span>
                )}
            </div>
        </div>
    );
};

export default ApiSettings;
