
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { SettingsIcon } from './Icons';

interface HeaderProps {
    user: User;
    onSettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onSettingsClick }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = `${time.getFullYear()}/${(time.getMonth() + 1).toString().padStart(2, '0')}/${time.getDate().toString().padStart(2, '0')}`;
    const formattedTime = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

    return (
        <header className="bg-white border-b border-gray-100 p-4 pt-6 pb-3 shadow-sm sticky top-0 z-20">
            <div className="px-2 flex justify-between items-center relative h-10">
                {/* 左側：系統時間 - 加深日期顏色 */}
                <div className="flex flex-col justify-center">
                    <div className="text-[8px] font-mono font-black text-gray-500 tracking-widest leading-none mb-0.5">{formattedDate}</div>
                    <div className="text-lg font-mono font-black text-[#577E89] leading-none tracking-tighter">{formattedTime}</div>
                </div>

                {/* 中間：使用者名稱 */}
                <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                    <h1 className="text-base font-black text-[#577E89] tracking-[0.3em] ml-1">{user.name}</h1>
                </div>

                {/* 右側：設定按鈕 - 加深顏色 */}
                <button onClick={onSettingsClick} className="p-2 rounded-full text-gray-400 hover:bg-[#577E89]/5 hover:text-[#577E89] transition-colors">
                    <SettingsIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};
