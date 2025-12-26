
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { LogoIcon, CheckIcon, CloseIcon } from './Icons';
import { api } from '../utils/googleSheetSync';
import { DEFAULT_API_URL } from '../constants';
import { ActionConfirmationModal } from './ActionConfirmationModal';

interface LoginPageProps {
  onLogin: (user: User, masterUrl?: string) => void;
}

type ViewMode = 'login' | 'register';

const PasswordRequirements: React.FC<{ password: string }> = ({ password }) => {
    const reqs = [
        { label: '6位', met: password.length >= 6 },
        { label: '大寫', met: /[A-Z]/.test(password) },
        { label: '小寫', met: /[a-z]/.test(password) },
        { label: '符號/數字', met: /[\d\W_]/.test(password) }
    ];

    return (
        <div className="flex gap-2 mt-1 px-1">
            {reqs.map((r, i) => (
                <div key={i} className={`flex items-center gap-1 transition-all duration-300 ${r.met ? 'opacity-100' : 'opacity-60'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center ${r.met ? 'bg-green-500' : 'bg-gray-400'}`}>
                        {r.met && <CheckIcon className="w-1.5 h-1.5 text-white" />}
                    </div>
                    <span className={`text-[9px] font-black ${r.met ? 'text-green-600' : 'text-gray-500'}`}>{r.label}</span>
                </div>
            ))}
        </div>
    );
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [time, setTime] = useState(new Date());
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  const [alertConfig, setAlertConfig] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);

  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [accountExists, setAccountExists] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState(false);
  
  const masterUrl = DEFAULT_API_URL;
  const isPhoneFormatValid = /^\d{10}$/.test(phone) && phone.startsWith('0');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showAlert = (msg: string, type: 'error' | 'success' = 'error') => {
      setAlertConfig({ msg, type });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    setPhone(numericValue);
    setAccountExists(null);
    setCheckError(false);
  }

  const handlePhoneBlur = async () => {
      if (isPhoneFormatValid) {
          setIsCheckingPhone(true);
          setCheckError(false);
          try {
              const check = await api.checkUserAvailability(masterUrl, phone);
              if (check.error) {
                  setCheckError(true);
                  setAccountExists(null);
                  return;
              }
              const exists = !check.isAvailable;
              setAccountExists(exists);
              
              if (viewMode === 'login' && !exists) {
                  showAlert('此手機號碼尚未註冊。');
              } else if (viewMode === 'register' && exists) {
                  showAlert('此手機號碼已註冊，請直接登入。');
              }
          } catch (e) { 
              setAccountExists(null); 
              setCheckError(true);
          }
          finally { setIsCheckingPhone(false); }
      }
  };

  const toggleViewMode = () => {
      setIsTransitioning(true);
      setTimeout(() => {
          setViewMode(prev => prev === 'login' ? 'register' : 'login');
          setPassword(''); setConfirmPassword(''); setName(''); setAccountExists(null); setCheckError(false);
          setTimeout(() => setIsTransitioning(false), 50);
      }, 350);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!isPhoneFormatValid) { showAlert('手機格式錯誤'); return; }
    if (viewMode === 'register') {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W_]).{6,}$/;
        if (!passwordRegex.test(password)) { showAlert('密碼不符合規則。\n（需含大小寫及符號）'); return; }
        if (password !== confirmPassword) { showAlert('兩次密碼輸入不一致'); return; }
        if (!name) { showAlert('請輸入名稱'); return; }
        if (accountExists === true) { showAlert('帳號已存在，請直接登入'); return; }
    }
    if (viewMode === 'login' && accountExists === false) {
        showAlert('此手機號碼尚未註冊');
        return;
    }

    setIsLoading(true);
    try {
        let result = await (viewMode === 'login' 
            ? api.login(masterUrl, { phone, password })
            : api.register(masterUrl, { phone, password, name }));
        
        if (result && result.success) {
            if (viewMode === 'login' || result.user) onLogin(result.user, masterUrl);
            else { 
                showAlert('註冊成功！', 'success'); 
                setTimeout(() => toggleViewMode(), 1200); 
            }
        } else {
            const errorMsg = result?.message === 'ACCOUNT_NOT_FOUND' ? '帳號尚未註冊' :
                             result?.message === 'WRONG_PASSWORD' ? '密碼不正確' : 
                             (result?.message || '驗證失敗');
            showAlert(errorMsg);
        }
    } catch (err) { showAlert('網路異常'); }
    finally { setIsLoading(false); }
  };

  const getStatusIcon = () => {
      if (isCheckingPhone) return <div className="animate-spin h-4 w-4 border-2 border-gray-100 border-t-[#577E89] rounded-full"></div>;
      if (checkError) return <span className="text-gray-500 text-[9px] font-black tracking-wider">連線中</span>;
      if (accountExists === null || phone.length < 10) return null;
      const isSuccess = viewMode === 'login' ? accountExists === true : accountExists === false;
      return <div className={`transition-all transform duration-300 ${isSuccess ? 'text-green-500 scale-125' : 'text-red-400 scale-100'}`}>
          {isSuccess ? <CheckIcon className="w-5 h-5 drop-shadow-sm" /> : <CloseIcon className="w-4 h-4" />}
      </div>;
  };

  const isRegister = viewMode === 'register';
  const formattedDate = `${time.getFullYear()}/${(time.getMonth() + 1).toString().padStart(2, '0')}/${time.getDate().toString().padStart(2, '0')}`;
  const formattedTime = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="relative h-[100dvh] bg-[#FDFAF5] overflow-hidden flex flex-col font-sans">
      <div className="pt-4 px-8 flex justify-between items-start z-30 shrink-0">
        <div className="bg-[#FDFAF5]/40 backdrop-blur-sm rounded-lg p-1">
          <div className="text-[8px] font-mono font-black text-gray-500 tracking-widest leading-none mb-0.5">{formattedDate}</div>
          <div className="text-lg font-mono font-black text-[#577E89] tracking-tighter leading-none">{formattedTime}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-0 py-2">
          <div className={`flex flex-col items-center transition-all duration-500 ease-in-out transform origin-center 
            ${isRegister ? 'scale-[0.65] -translate-y-4' : 'scale-100 translate-y-0'} 
            ${isTransitioning ? 'opacity-0 blur-md' : 'opacity-100'}`}
          >
            <div className="w-16 h-16 mb-2 drop-shadow-sm">
                 <LogoIcon className="w-full h-full" />
            </div>
            <h1 className="font-serif font-black text-[#577E89] text-3xl tracking-[0.4em] ml-3">營運寶</h1>
            <p className="text-gray-500 font-black tracking-[0.3em] text-[9px] uppercase mt-1">專注美業・經營有道</p>
          </div>
      </div>

      <div 
        className={`w-full max-w-lg mx-auto bg-white shadow-[0_-15px_40px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] border-t border-white/50 px-8 pt-6 pb-8 transition-all duration-500 z-20 shrink-0
          ${isTransitioning ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
      >
        <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            {isRegister && (
              <div className="space-y-0.5">
                <label className="text-[9px] font-black text-[#577E89] ml-1 uppercase tracking-wider">設計師名稱</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-1 py-1 bg-transparent border-b border-gray-100 focus:border-[#E1A36F] outline-none transition-all text-xl font-black text-[#577E89]" required />
              </div>
            )}
            <div className="space-y-0.5">
              <label className="text-[9px] font-black text-[#577E89] ml-1 uppercase tracking-wider">手機號碼</label>
              <div className="relative">
                <input type="tel" inputMode="numeric" value={phone} onChange={handlePhoneChange} onBlur={handlePhoneBlur}
                  className="w-full pl-1 pr-14 py-1 bg-transparent border-b border-gray-100 focus:border-[#E1A36F] outline-none transition-all font-mono text-xl font-black text-[#577E89] tracking-widest"
                  maxLength={10} required />
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2">{getStatusIcon()}</div>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between items-end px-1">
                <label className="text-[9px] font-black text-[#577E89] uppercase tracking-wider">密碼</label>
                {!isRegister && <button type="button" onClick={() => setShowContactAdmin(true)} className="text-[9px] font-black text-[#E1A36F] mb-0.5">忘記密碼？</button>}
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-1 py-1 bg-transparent border-b border-gray-100 focus:border-[#E1A36F] outline-none transition-all tracking-[0.2em] text-xl font-black text-[#577E89]" required />
              {isRegister && <PasswordRequirements password={password} />}
            </div>
            {isRegister && (
              <div className="space-y-0.5">
                <label className="text-[9px] font-black text-[#577E89] ml-1 uppercase tracking-wider">確認密碼</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-1 py-1 bg-transparent border-b border-gray-100 focus:border-[#E1A36F] outline-none transition-all tracking-[0.2em] text-xl font-black text-[#577E89]" required />
              </div>
            )}
          </div>
          
          <div className="pt-2">
            <button type="submit" disabled={isLoading || isCheckingPhone}
              className="w-full py-4 bg-[#577E89] text-base font-black text-white rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex flex-col items-center justify-center gap-1">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-[10px] opacity-80 mt-1">
                    {isRegister ? '正在建立帳號...' : '系統登入中...'}
                  </span>
                </>
              ) : (
                <span>{isRegister ? '建立帳號' : '登入系統'}</span>
              )}
            </button>
            <button type="button" onClick={toggleViewMode} className="w-full py-3 mt-1 text-[#E1A36F] text-[13px] font-black tracking-widest transition-opacity active:opacity-60">
              {isRegister ? '已有帳號？點此登入' : '第一次使用？點此註冊'}
            </button>
          </div>
        </form>
      </div>
      
      {alertConfig && (
          <ActionConfirmationModal title="" message={alertConfig.msg} confirmText="知道了" variant={alertConfig.type === 'error' ? 'danger' : 'info'} onConfirm={() => setAlertConfig(null)} />
      )}
      {showContactAdmin && (
          <ActionConfirmationModal title="" message="請聯繫系統管理員。" confirmText="確認" variant="info" onConfirm={() => setShowContactAdmin(false)} />
      )}
    </div>
  );
};
