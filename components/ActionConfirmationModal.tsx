
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ActionConfirmationModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void; 
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({ 
    title, 
    message, 
    confirmText = '確認', 
    cancelText = '取消', 
    variant = 'danger',
    onConfirm, 
    onCancel 
}) => {
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const confirmBtnClass = variant === 'danger' 
    ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300' 
    : variant === 'warning' 
        ? 'bg-[#E1A36F] hover:bg-[#c48b5a] focus:ring-[#E1A36F]' 
        : 'bg-[#577E89] hover:bg-[#4a6b75] focus:ring-[#577E89]';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div 
        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform scale-100 transition-all border-t border-white"
        onClick={e => e.stopPropagation()}
      >
        {title && <h3 className="text-lg font-black text-gray-800 mb-4 text-center tracking-widest">{title}</h3>}
        <p className={`text-gray-600 font-bold leading-relaxed whitespace-pre-line text-center ${title ? 'text-sm mb-6' : 'text-base mb-8 mt-2'}`}>
            {message}
        </p>
        
        <div className="flex gap-3">
            <button 
                onClick={onCancel} 
                className="flex-1 py-3 text-sm font-black text-gray-400 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors active:scale-95"
            >
                {cancelText}
            </button>
            <button 
                onClick={onConfirm} 
                className={`flex-1 py-3 text-sm font-black text-white rounded-2xl shadow-lg transition-all active:scale-95 ${confirmBtnClass}`}
            >
                {confirmText}
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
