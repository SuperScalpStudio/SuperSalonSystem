
import React from 'react';
import type { Customer } from '../types';
import { PencilIcon } from './Icons';

interface CustomerInfoCardProps {
  customer: Customer;
  onAddBooking: () => void;
  onViewBookings: () => void;
  onEdit: () => void;
}

export const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({ customer, onAddBooking, onViewBookings, onEdit }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100/60 overflow-hidden flex flex-col transition-all hover:shadow-md mb-3">
      <div className="p-4 flex justify-between items-start">
        {/* Left Side: Basic Info */}
        <div className="flex flex-col justify-start flex-1 min-w-0 mr-2">
            {/* Name & Edit */}
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-[#577E89] tracking-tight truncate">
                    {customer.name}
                </h3>
                <button 
                    onClick={onEdit} 
                    className="text-gray-400 hover:text-[#577E89] transition-colors p-0.5"
                    aria-label="編輯"
                >
                    <PencilIcon className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Phone | Birthday - 加深文字色彩 */}
            <div className="text-sm text-gray-600 font-mono font-bold tracking-wide flex items-center mb-1.5">
                <span>{customer.phone}</span>
                <span className="mx-2 text-gray-300">｜</span>
                <span>{customer.birthday || '--/--'}</span>
            </div>
            
            {/* Stats Badges */}
            <div className="flex flex-wrap gap-1.5 mb-1.5">
                {(customer.statsModify || 0) > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-gray-100 text-gray-600 border border-gray-200">
                        修改 {customer.statsModify}
                    </span>
                )}
                {(customer.statsCancel || 0) > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-white text-red-500 border border-red-200">
                        取消 {customer.statsCancel}
                    </span>
                )}
                {(customer.statsNoShow || 0) > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-red-500 text-white border border-red-500 shadow-sm">
                        未到 {customer.statsNoShow}
                    </span>
                )}
            </div>

            {/* Notes - 加深備註字體色彩 */}
            {customer.notes && (
                <div className="text-xs text-gray-500 font-medium truncate w-full">
                    {customer.notes}
                </div>
            )}
        </div>

        {/* Right Side: Revenue Stats */}
        <div className="text-right flex flex-col justify-start h-full pt-1 shrink-0">
             <div className="mb-0.5">
                <p className="text-lg font-black text-[#6F9F9C] leading-none">
                    ${customer.statsAmount.toLocaleString()}
                </p>
             </div>
             <div>
                <p className="text-xs text-gray-500 font-black tracking-tighter">
                    來店 {customer.statsVisits} 次
                </p>
             </div>
        </div>
      </div>

      {/* Footer: Actions */}
      <div className="bg-gray-50/30 px-3 py-2 flex gap-2 border-t border-gray-50">
         <button 
            onClick={onAddBooking}
            className="flex-1 py-2 text-xs font-black text-white bg-[#577E89] rounded-lg shadow-sm hover:bg-[#4a6b75] transition-colors"
         >
            新增預約
         </button>
         <button 
            onClick={onViewBookings}
            className="flex-1 py-2 text-xs font-black text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-[#577E89] hover:text-[#577E89] transition-all"
         >
            全部預約
         </button>
      </div>
    </div>
  );
};
