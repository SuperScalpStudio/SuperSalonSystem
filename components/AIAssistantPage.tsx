
import React, { useState } from 'react';
import { generateImageForIdea, expandIdea } from '../services/geminiService';
import { AppStatus, ExpandedContent } from '../types';
import { SparklesIcon, SearchIcon } from './Icons';
import { Visualizer } from './Visualizer';

export const AIAssistantPage: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [adviceData, setAdviceData] = useState<ExpandedContent | null>(null);

    const handleAskAI = async () => {
        if (!prompt.trim()) return;
        setStatus(AppStatus.EXPANDING);
        setAdviceData(null);
        try {
            const res = await expandIdea(`作為一位資深美髮師，請針對以下需求提供專業建議，並延伸相關的技術與產品知識點：${prompt}`);
            setAdviceData(res);
            setStatus(AppStatus.SUCCESS);
        } catch (e) {
            console.error(e);
            setStatus(AppStatus.ERROR);
        }
    };

    const handleGenerateStyle = async () => {
        if (!prompt.trim()) return;
        setStatus(AppStatus.GENERATING_IMAGE);
        setResultImage(null);
        try {
            const url = await generateImageForIdea(`髮型參考：${prompt}，極致高清攝影，專業沙龍光影細節`);
            setResultImage(url);
            setStatus(AppStatus.SUCCESS);
        } catch (e) {
            console.error(e);
            setStatus(AppStatus.ERROR);
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24 overflow-y-auto h-full">
            <div className="text-center space-y-2 py-4">
                <div className="flex justify-center">
                    <div className="bg-[#577E89]/10 p-4 rounded-full">
                        <SparklesIcon className="w-10 h-10 text-[#577E89]" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-[#577E89] font-serif tracking-widest">AI 造型助理</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">智能對話・髮型生成・專業建議</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
                <label className="block text-xs font-black text-[#577E89] uppercase tracking-wider">輸入您的技術疑問或髮型需求</label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="例如：建議今年夏天適合圓臉的短髮造型，或是如何針對受損髮進行調色？"
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl h-32 focus:ring-2 focus:ring-[#577E89] outline-none text-sm leading-relaxed"
                />
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleAskAI}
                        disabled={status === AppStatus.EXPANDING || status === AppStatus.GENERATING_IMAGE}
                        className="flex items-center justify-center gap-2 py-3.5 bg-[#577E89] text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                        <SearchIcon className="w-4 h-4" />
                        獲取建議
                    </button>
                    <button 
                        onClick={handleGenerateStyle}
                        disabled={status === AppStatus.EXPANDING || status === AppStatus.GENERATING_IMAGE}
                        className="flex items-center justify-center gap-2 py-3.5 bg-[#E1A36F] text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        生成髮型
                    </button>
                </div>
            </div>

            {(status === AppStatus.EXPANDING || status === AppStatus.GENERATING_IMAGE) && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <div className="w-10 h-10 border-4 border-[#577E89]/20 border-t-[#577E89] rounded-full animate-spin"></div>
                    <p className="text-[#577E89] font-black text-sm animate-pulse tracking-widest">AI 正在深度思考中...</p>
                </div>
            )}

            {adviceData && (
                <div className="space-y-6 animate-page-enter">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-[#577E89] font-black mb-3 flex items-center gap-2">
                            <div className="w-1 h-5 bg-[#E1A36F] rounded-full"></div>
                            {adviceData.title || "專業造型建議"}
                        </h3>
                        <p className="text-xs text-[#E1A36F] font-bold mb-4 italic">{adviceData.summary}</p>
                        <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                            {adviceData.narrative}
                        </div>
                    </div>

                    {/* 知識圖譜視覺化 */}
                    <div className="bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden p-1 border-4 border-white">
                        <Visualizer nodes={adviceData.nodes} links={adviceData.links} />
                    </div>
                </div>
            )}

            {resultImage && (
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-page-enter">
                    <h3 className="text-[#577E89] font-black mb-3 px-2 flex items-center gap-2">
                        <div className="w-1 h-5 bg-[#E1A36F] rounded-full"></div>
                        AI 參考髮型圖
                    </h3>
                    <img src={resultImage} alt="AI Generated" className="w-full rounded-2xl shadow-inner mb-2" />
                    <p className="text-[10px] text-gray-400 text-center italic">由 Gemini 2.5 Flash 生成的視覺參考</p>
                </div>
            )}
            
            {status === AppStatus.ERROR && (
                <div className="p-4 bg-red-50 text-red-500 text-center rounded-2xl text-sm font-bold border border-red-100">
                    AI 呼叫失敗，請檢查網路連接或 API Key 設定。
                </div>
            )}
        </div>
    );
};
