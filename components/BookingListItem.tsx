
import React from 'react';
import { Booking, BookingStatus } from '../types';

const StatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
  const statusMap: Record<BookingStatus, { text: string, color: string, bg: string }> = {
    [BookingStatus.Booked]: { text: '已預約', color: 'text-[#577E89]', bg: 'bg-[#577E89]/10' },
    [BookingStatus.Paid]: { text: '已結帳', color: 'text-[#6F9F9C]', bg: 'bg-[#6F9F9C]/10' },
    [BookingStatus.Canceled]: { text: '已取消', color: 'text-gray-400', bg: 'bg-gray-100' },
    [BookingStatus.NoShow]: { text: '未到', color: 'text-[#E1A36F]', bg: 'bg-[#E1A36F]/10' },
  };
  const { text, color, bg } = statusMap[status] || statusMap[BookingStatus.Canceled];
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${color} ${bg} border border-transparent`}>{text}</span>
  );
};

const ActionButton: React.FC<{ onClick: () => void, children: React.ReactNode, variant?: 'primary' | 'danger' | 'neutral' | 'solid-red' }> = ({ onClick, children, variant = 'neutral' }) => {
    let baseClass = "px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 border transform active:scale-95";
    
    if (variant === 'primary') {
        baseClass += " bg-[#577E89] text-white border-[#577E89] hover:bg-[#4a6b75]";
    } else if (variant === 'danger') {
        baseClass += " bg-white text-red-500 border-red-200 hover:bg-red-50";
    } else if (variant === 'solid-red') {
        baseClass += " bg-red-500 text-white border-red-500 hover:bg-red-600 shadow-sm";
    } else {
        baseClass += " bg-white text-gray-500 border-gray-100 hover:bg-gray-50 hover:text-gray-800";
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // CRITICAL: Stop event from bubbling up
        onClick();
    };

    return (
        <button type="button" onClick={handleClick} className={baseClass}>
            {children}
        </button>
    );
};

interface BookingListItemProps {
  booking: Booking;
  actions: {
    onModify?: (booking: Booking) => void;
    onCancel?: (bookingId: string) => void;
    onCheckout?: (booking: Booking) => void;
    onNoShow?: (bookingId: string) => void;
  };
  showCustomerName?: boolean;
  showFullDate?: boolean;
}

export const BookingListItem: React.FC<BookingListItemProps> = ({ booking, actions, showCustomerName, showFullDate = true }) => {
  
  const formatFullDate = (dateStr: string, timeStr: string) => {
    // 20240805 -> 2024/08/05
    const str = String(dateStr); // Ensure string
    const y = str.substring(0, 4);
    const m = str.substring(4, 6);
    const d = str.substring(6, 8);
    return `${y}/${m}/${d} ${timeStr}`;
  }

  const { onModify, onCancel, onCheckout, onNoShow } = actions;
  const isBooked = booking.status === BookingStatus.Booked;

  return (
    <li className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
        {/* Card Header */}
        <div className="flex justify-between items-center px-4 py-2 bg-gray-100/50 border-b border-gray-100">
            <div className="flex items-center space-x-2 text-xs text-gray-500 font-mono font-medium tracking-wide">
                <span>{showFullDate ? formatFullDate(booking.date, booking.startTime) : booking.startTime}</span>
            </div>
            <StatusBadge status={booking.status} />
        </div>

        {/* Card Body */}
        <div className="p-3">
            <div className="flex flex-col">
                {showCustomerName && (
                    <h4 className="text-base font-bold text-[#577E89] mb-1 tracking-tight">{booking.customerName}</h4>
                )}
                <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-semibold text-sm">
                        {booking.services.join('、')}
                    </span>
                </div>
            </div>

            {(booking.notes || booking.checkoutNotes) && (
                <div className="mt-2 text-xs bg-[#FDFAF5] p-2 rounded-lg border border-[#E2D8A5]/30 text-gray-600">
                    {booking.notes && (
                        <div className="flex gap-2">
                            <span className="text-[#E1A36F] font-bold flex-shrink-0">預約</span>
                            <span>{booking.notes}</span>
                        </div>
                    )}
                    {booking.checkoutNotes && (
                        <div className="flex gap-2 mt-1">
                             <span className="text-[#6F9F9C] font-bold flex-shrink-0">結帳</span>
                             <span>{booking.checkoutNotes}</span>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Card Footer: Actions */}
        {(isBooked && (onModify || onCancel || onCheckout || onNoShow)) && (
            <div className="px-3 py-2 border-t border-gray-100 flex justify-end gap-2 bg-white flex-wrap">
                
                {onCheckout && (
                    <ActionButton onClick={() => onCheckout(booking)} variant="primary">
                        結帳
                    </ActionButton>
                )}
                
                {onModify && (
                    <ActionButton onClick={() => onModify(booking)}>
                        修改
                    </ActionButton>
                )}

                 {onCancel && (
                    <ActionButton onClick={() => onCancel(booking.id)} variant="danger">
                        取消
                    </ActionButton>
                )}

                {onNoShow && (
                    <ActionButton onClick={() => onNoShow(booking.id)} variant="solid-red">
                        未到
                    </ActionButton>
                )}
            </div>
        )}
    </li>
  );
};
