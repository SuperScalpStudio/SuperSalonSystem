
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Booking, Customer } from '../types';
import { BookingListItem } from './BookingListItem';

interface CustomerBookingsModalProps {
  customer: Customer;
  bookings: Booking[];
  onClose: () => void;
  onModify: (booking: Booking) => void;
  onCancel: (bookingId: string) => void;
  onNoShow?: (bookingId: string) => void;
}

export const CustomerBookingsModal: React.FC<CustomerBookingsModalProps> = ({ customer, bookings, onClose, onModify, onCancel, onNoShow }) => {
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg max-h-[85vh] rounded-3xl p-5 shadow-lg flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-xl font-bold text-[#577E89]">{customer.name} 的全部預約</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {bookings.length > 0 ? (
             <ul className="space-y-3 pb-4">
              {bookings.sort((a,b) => b.startMs - a.startMs).map(booking => (
                <BookingListItem 
                  key={booking.id}
                  booking={booking}
                  actions={{ onModify, onCancel, onNoShow }}
                  showFullDate={true}
                />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <p>尚無預約紀錄</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
