
import React, { useState } from 'react';
import type { Customer } from '../types';

interface NewCustomerFormProps {
  phone: string;
  onCreateCustomer: (customer: Customer) => void;
  onCancel: () => void;
}

export const NewCustomerForm: React.FC<NewCustomerFormProps> = ({ phone, onCreateCustomer, onCancel }) => {
  const [name, setName] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
        alert('請輸入顧客姓名');
        return;
    }
    const birthday = birthMonth && birthDay ? `${birthMonth}/${birthDay}` : '';
    const newCustomer: Customer = {
      id: phone.substring(1),
      phone,
      name,
      birthday,
      notes,
      statsVisits: 0,
      statsAmount: 0,
      statsCancel: 0,
      statsNoShow: 0,
      statsModify: 0,
      createdAtMs: Date.now(),
    };
    onCreateCustomer(newCustomer);
  };
  
  return (
    <div className="p-5 bg-white border border-[rgb(var(--color-border))] rounded-2xl shadow-lg transition-shadow hover:shadow-xl">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">建立新顧客</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#577E89] uppercase tracking-wider mb-1">顧客電話</label>
          <input
            type="text"
            value={phone}
            readOnly
            className="w-full px-4 py-2.5 text-gray-600 bg-gray-100 border border-[rgb(var(--color-border))] rounded-xl font-mono"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-[#577E89] uppercase tracking-wider mb-1">顧客姓名 *</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                />
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
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
            placeholder="記錄顧客喜好、職業、注意事項等"
          ></textarea>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-semibold text-[rgb(var(--color-text))] bg-white border border-[rgb(var(--color-border))] rounded-lg hover:bg-gray-100 transition-colors">
            取消
          </button>
          <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-[rgb(var(--color-primary))] rounded-lg shadow-md hover:opacity-90 transition-colors">
            建立顧客
          </button>
        </div>
      </form>
    </div>
  );
};
