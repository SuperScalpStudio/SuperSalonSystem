
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SERVICES } from '../constants';
import type { User, AppSettings } from '../types';
import { api } from '../utils/googleSheetSync';
import { CloseIcon, CheckIcon } from './Icons';
import { ActionConfirmationModal } from './ActionConfirmationModal';

interface SettingsPageProps {
  user: User;
  settings: AppSettings;
  onLogout: () => void;
  onClose: () => void;
  onUpdateSettings: (settings: AppSettings) => void;
}

const PasswordRequirements: React.FC<{ password: string }> = ({ password }) => {
    const reqs = [
        { label: '6位', met: password.length >= 6 },
        { label: '大寫', met: /[A-Z]/.test(password) },
        { label: '小寫', met: /[a-z]/.test(password) },
        { label: '符號/數字', met: /[\d\W_]/.test(password) }
    ];

    return (
        <div className="flex gap-2 mt-1.5 px-1">
            {reqs.map((r, i) => (
                <div key={i} className={`flex items-center gap-1 transition-all duration-300 ${r.met ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center ${r.met ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {r.met && <CheckIcon className="w-1.5 h-1.5 text-white" />}
                    </div>
                    <span className={`text-[9px] font-black ${r.met ? 'text-green-600' : 'text-gray-400'}`}>{r.label}</span>
                </div>
            ))}
        </div>
    );
};

const ChangePasswordModal: React.FC<{ user: User, googleSheetUrl: string, onClose: () => void }> = ({ user, googleSheetUrl, onClose }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [msg, setMsg] = useState<{type: 'error'|'success', text: string} | null>(null);

    const validateStrongPassword = (pwd: string): boolean => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W_]).{6,}$/;
        return regex.test(pwd);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        if (newPassword !== confirmPassword) { setMsg({ type: 'error', text: '確認密碼不相符' }); return; }
        if (!validateStrongPassword(newPassword)) { setMsg({ type: 'error', text: '密碼不符合規則' }); return; }
        setIsLoading(true);
        try {
            const result = await api.changePassword(googleSheetUrl, { phone: user.phone, oldPassword, newPassword });
            if (result.success) {
                setMsg({ type: 'success', text: '密碼修改成功！' });
                setTimeout(onClose, 1500);
            } else { setMsg({ type: 'error', text: result.message || '舊密碼錯誤' }); }
        } catch (error) { setMsg({ type: 'error', text: '連線錯誤' }); }
        finally { setIsLoading(false); }
    };

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-black text-[#577E89] mb-4 text-center tracking-widest">修改密碼</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input type="password" placeholder="舊密碼" value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#577E89] outline-none font-mono tracking-widest text-base" required />
                    <div className="space-y-0.5">
                        <input type="password" placeholder="新密碼" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#577E89] outline-none font-mono tracking-widest text-base" required />
                        <PasswordRequirements password={newPassword} />
                    </div>
                    <input type="password" placeholder="確認新密碼" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#577E89] outline-none font-mono tracking-widest text-base" required />
                    
                    {msg && <p className="text-[10px] text-center font-bold text-red-500">{msg.text}</p>}

                    <div className="flex gap-2 pt-2">
                         <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-black bg-gray-100 rounded-xl text-gray-400 active:scale-95 transition-all">取消</button>
                         <button type="submit" disabled={isLoading} className="flex-1 py-2.5 text-sm font-black bg-[#577E89] text-white rounded-xl shadow-lg disabled:opacity-50 active:scale-95 transition-all">
                             {isLoading ? '處理中' : '儲存'}
                         </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, settings, onLogout, onClose, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [confirmState, setConfirmState] = useState<'save' | 'close' | 'logout' | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleDurationChange = (serviceName: string, value: string) => {
    const newDurations = { ...localSettings.serviceDurations, [serviceName]: Number(value) || 0 };
    setLocalSettings(prev => ({ ...prev, serviceDurations: newDurations }));
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings(prev => ({ ...prev, productSalesEnabled: e.target.checked }));
  };

  const handleSaveChanges = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FDFAF5] animate-fade-in-up max-w-lg mx-auto shadow-2xl overflow-hidden">
      <header className="bg-white border-b border-gray-100 px-4 pt-3 pb-2 shadow-sm sticky top-0 z-20">
          <div className="px-2 flex justify-between items-center relative h-8">
                <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                    <h1 className="text-sm font-black text-[#577E89] tracking-[0.3em] ml-1">系統設定</h1>
                </div>

                <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => setConfirmState('save')} className="p-1.5 rounded-full text-[#577E89] hover:bg-[#577E89]/5 transition-colors" title="儲存設定">
                        <CheckIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setConfirmState('close')} className="p-1.5 rounded-full text-gray-300 hover:bg-gray-100 transition-colors" title="關閉">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-[10px] font-black mb-6 text-gray-500 uppercase tracking-widest border-b border-gray-50 pb-3 text-center">服務與功能偏好</h2>
            
            <div className="grid grid-cols-2 gap-3">
                {SERVICES.map(service => (
                    <div key={service.name} className="flex flex-col gap-2 p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                        <span className="font-bold text-gray-600 text-xs">{service.name}</span>
                        <div className="flex items-center gap-2">
                            <input type="number" inputMode="numeric"
                                value={localSettings.serviceDurations[service.name] || service.durationMinutes} 
                                onChange={(e) => handleDurationChange(service.name, e.target.value)}
                                className="w-full p-1.5 text-center text-base font-mono font-black border border-gray-200 rounded-xl bg-white focus:ring-1 focus:ring-[#577E89] outline-none"
                            />
                            <span className="text-[9px] font-black text-gray-400 shrink-0">分鐘</span>
                        </div>
                    </div>
                ))}

                {/* 商品銷售開關：格式與服務項目完全相同，位於「其他」右側 */}
                <div className="flex flex-col gap-2 p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                    <span className="font-bold text-gray-600 text-xs">商品銷售</span>
                    <div className="flex items-center justify-center h-[42px]"> {/* 高度與輸入框對齊 */}
                        <label className="ios-switch shrink-0 scale-90">
                            <input type="checkbox" checked={localSettings.productSalesEnabled} onChange={handleToggleChange} />
                            <span className="ios-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-3">
            <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-[#E1A36F] hover:bg-orange-50/30 transition-all active:scale-[0.98]"
            >
                <span className="font-black text-sm tracking-[0.2em]">修改登入密碼</span>
            </button>

            <button 
                onClick={() => setConfirmState('logout')} 
                className="w-full py-4 bg-red-50 text-red-500 font-black text-sm tracking-[0.2em] rounded-2xl border border-red-100 active:scale-[0.98] transition-all"
            >
                登出帳號
            </button>
        </div>
      </main>

      {confirmState === 'save' && (
          <ActionConfirmationModal title="儲存設定" message="確定要儲存目前的變更嗎？" confirmText="確定儲存" cancelText="繼續設定" variant="info" onConfirm={handleSaveChanges} onCancel={() => setConfirmState(null)} />
      )}
      {confirmState === 'close' && (
          <ActionConfirmationModal title="取消變更" message="有尚未儲存的變更，確定要直接返回嗎？" confirmText="確定返回" cancelText="繼續設定" variant="warning" onConfirm={onClose} onCancel={() => setConfirmState(null)} />
      )}
      {confirmState === 'logout' && (
          <ActionConfirmationModal title="帳號登出" message="確定要登出系統嗎？" confirmText="確認登出" cancelText="返回" variant="danger" onConfirm={onLogout} onCancel={() => setConfirmState(null)} />
      )}

      {showPasswordModal && user.googleSheetUrl && (
          <ChangePasswordModal user={user} googleSheetUrl={user.googleSheetUrl} onClose={() => setShowPasswordModal(false)} />
      )}

      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
        main::-webkit-scrollbar { display: none; }
        main { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>,
    document.body
  );
};
