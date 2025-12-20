
import React, { useState, useMemo } from 'react';
import { DayDetailModal } from './DayDetailModal';
import { type Booking } from '../types';

interface CalendarViewProps {
  bookings: Booking[];
  onModifyBooking: (booking: Booking) => void;
  onCancelBooking: (bookingId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ bookings, onModifyBooking, onCancelBooking }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const bookingsByDate = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      const bDate = String(booking.date); // Force string to avoid slice error
      const dateStr = `${bDate.slice(0,4)}-${bDate.slice(4,6)}-${bDate.slice(6,8)}`;
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(booking);
      return acc;
    }, {} as Record<string, Booking[]>);
  }, [bookings]);

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };
  
  const today = new Date();
  today.setHours(0,0,0,0);

  const days = Array.from({ length: firstDayOfMonth }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );
  
  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(year, month, day));
  }

  return (
    <div className="p-4">
      {/* Calendar Card Container */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 overflow-hidden relative">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-[#FDFAF5] rounded-bl-full -mr-10 -mt-10"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <button 
                onClick={() => changeMonth(-1)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
            >
                &larr;
            </button>
            <div className="text-xl font-bold text-[#577E89] tracking-tight">
                {`${year} 年 ${month + 1} 月`}
            </div>
            <button 
                onClick={() => changeMonth(1)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
            >
                &rarr;
            </button>
          </div>
          <button 
            onClick={() => setCurrentDate(new Date())} 
            className="px-4 py-1.5 text-sm bg-[#E1A36F] text-white font-bold rounded-full shadow-md hover:bg-[#c48b5a] transition-all transform hover:scale-105"
          >
            今天
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">
          {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
             <div key={d} className={`${i === 0 || i === 6 ? 'text-[#E1A36F]' : ''}`}>{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-3 gap-x-1">
          {days.map((day, index) => {
            const date = day ? new Date(year, month, day) : null;
            const dateString = date ? `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : '';
            const hasBooking = dateString && bookingsByDate[dateString] && bookingsByDate[dateString].some(b => b.status === 'booked' || b.status === 'paid');
            const isToday = date?.getTime() === today.getTime();
            const isWeekend = index % 7 === 0 || index % 7 === 6;

            return (
              <div
                key={index}
                onClick={() => day && handleDayClick(day)}
                className={`
                    h-12 flex flex-col items-center justify-center rounded-xl relative transition-all duration-200 group
                    ${day ? 'cursor-pointer hover:bg-gray-50' : ''}
                `}
              >
                {day && (
                    <>
                    <span className={`
                        text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-all
                        ${isToday 
                            ? 'bg-[#577E89] text-white shadow-md' 
                            : isWeekend ? 'text-gray-500' : 'text-gray-700'
                        }
                        ${!isToday && day ? 'group-hover:bg-[#577E89]/10 group-hover:text-[#577E89]' : ''}
                    `}>
                        {day}
                    </span>
                    {hasBooking && (
                        <div className="absolute bottom-1 w-1.5 h-1.5 bg-[#E1A36F] rounded-full shadow-sm"></div>
                    )}
                    </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {selectedDate && (
        <DayDetailModal 
            date={selectedDate} 
            bookings={bookingsByDate[`${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`] || []}
            onClose={() => setSelectedDate(null)}
            onModify={onModifyBooking}
            onCancel={onCancelBooking}
        />
      )}
    </div>
  );
};
