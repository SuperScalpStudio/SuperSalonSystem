
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Booking } from '../types';
import { GanttChart } from './GanttChart';
import { BookingListItem } from './BookingListItem';

interface DayDetailModalProps {
  date: Date;
  bookings: Booking[];
  onClose: () => void;
  onModify: (booking: Booking) => void;
  onCancel: (bookingId: string) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ date, bookings, onClose, onModify, onCancel }) => {
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#FDFAF5] w-full max-w-lg max-h-[85vh] rounded-t-[2.5rem] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col animate-slide-up relative"
        onClick={e => e.stopPropagation()}
      >
        {/* 頂部裝飾把手 (Drag Handle) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full"></div>

        <div className="flex justify-between items-center pb-4 mt-2 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-black text-[#577E89] tracking-tight">
                {date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">每日行程概覽</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-6 space-y-8 scrollbar-hide">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-center text-gray-500 font-bold">這天目前沒有預約</p>
            </div>
          ) : (
            <>
              <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-[#E1A36F] rounded-full"></div>
                    <h4 className="font-black text-xs text-gray-500 uppercase tracking-[0.2em]">預約時間軸</h4>
                </div>
                <GanttChart bookings={bookings} />
              </section>

              <section className="pb-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-[#577E89] rounded-full"></div>
                    <h4 className="font-black text-xs text-gray-500 uppercase tracking-[0.2em]">預約明細</h4>
                </div>
                <ul className="space-y-4">
                  {bookings.sort((a, b) => a.startMs - b.startMs).map(booking => (
                    <BookingListItem 
                      key={booking.id}
                      booking={booking}
                      actions={{ onModify, onCancel }}
                      showCustomerName={true}
                      showFullDate={false}
                    />
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
