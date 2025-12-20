
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Customer } from '../types';

interface CustomerEditModalProps {
  customer: Customer;
  onSave: (updatedCustomer: Customer) => void;
  onClose: () => void;
}

export const CustomerEditModal: React.FC<CustomerEditModalProps> = ({ customer, onSave, onClose }) => {
  const [name, setName] = useState(customer.name);
  const [notes, setNotes] = useState(customer.notes);
  const [birthMonth, setBirthMonth] = useState(customer.birthday ? customer.birthday.split('/')[0] : '');
  const [birthDay, setBirthDay] = useState(customer.birthday ? customer.birthday.split('/')[1] : '');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { alert('請輸入顧客姓名'); return; }
    const birthday = birthMonth && birthDay ? `${birthMonth}/${birthDay}` : '';
    onSave({ ...customer, name, birthday, notes });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-[#577E89]">編輯顧客資料</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-light leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-[#577E89] uppercase tracking-wider mb-1">顧客姓名 *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2.5 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#577E89] uppercase tracking-wider mb-1">生日</label>
                    <div className="flex space-x-2">
                        <select value={birthMonth} onChange={e => setBirthMonth(e.target.value)} className="w-full px-2 py-2.5 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]">
                            <option value="">月</option>
                            {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={birthDay} onChange={e => setBirthDay(e.target.value)} className="w-full px-2 py-2.5 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]">
                            <option value="">日</option>
                            {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <div>
            <label className="block text-xs font-bold text-[#577E89] uppercase tracking-wider mb-1">顧客備註</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]" placeholder="記錄顧客喜好、職業、注意事項等"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-[rgb(var(--color-text))] bg-white border border-[rgb(var(--color-border))] rounded-lg hover:bg-gray-100 transition-colors">取消</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-[rgb(var(--color-primary))] rounded-lg shadow-md hover:opacity-90 transition-colors">儲存變更</button>
            </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
