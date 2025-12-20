
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[rgb(var(--color-bg))] w-full max-w-lg max-h-[85vh] rounded-t-3xl p-5 shadow-lg flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-[rgb(var(--color-border))]">
          <h3 className="text-xl font-bold">{date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-6">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16">
                <p className="text-center text-gray-400">這天目前沒有預約</p>
            </div>
          ) : (
            <>
              <section>
                <h4 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-widest">時間軸</h4>
                <GanttChart bookings={bookings} />
              </section>
              <section className="pb-8">
                <h4 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-widest">預約清單</h4>
                <ul className="space-y-3">
                  {bookings.sort((a, b) => a.startMs - b.startMs).map(booking => (
                    <BookingListItem 
                      key={booking.id}
                      booking={booking}
                      actions={{ onModify, onCancel }}
                      showCustomerName={true}
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
