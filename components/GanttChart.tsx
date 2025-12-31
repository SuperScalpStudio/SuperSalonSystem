import React from 'react';
import type { Booking } from '../types';

interface GanttChartProps {
  bookings: Booking[];
}

const START_HOUR = 8;
const END_HOUR = 22;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const bookingColors = [
    'bg-indigo-400/80', 'bg-purple-400/80', 'bg-pink-400/80', 'bg-blue-400/80', 'bg-teal-400/80', 'bg-emerald-400/80'
];

export const GanttChart: React.FC<GanttChartProps> = ({ bookings }) => {
  const getPosition = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number);
    const minutesFromStart = (hour - START_HOUR) * 60 + minute;
    return Math.max(0, (minutesFromStart / TOTAL_MINUTES) * 100);
  };
  
  const getWidth = (startTime: string, endTime: string): number => {
     const [startH, startM] = startTime.split(':').map(Number);
     const [endH, endM] = endTime.split(':').map(Number);
     const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
     return Math.max(0, (durationMinutes / TOTAL_MINUTES) * 100);
  };

  const sortedBookings = [...bookings].sort((a,b) => a.startMs - b.startMs);

  return (
    <div className="relative w-full bg-gray-100 rounded-xl p-4 min-h-[6rem]">
      {/* Time Axis Labels */}
      <div className="relative flex justify-between text-xs text-gray-400 mb-2 px-2">
        {Array.from({length: (END_HOUR - START_HOUR) / 2 + 1}, (_, i) => START_HOUR + i * 2).map(h => (
            <span key={h} className="flex-1 text-center">{String(h).padStart(2,'0')}</span>
        ))}
      </div>
      
      <div className="relative w-full h-8">
        {/* Background Lines */}
        <div className="absolute top-0 left-0 right-0 h-full flex justify-around">
           {Array.from({length: (END_HOUR - START_HOUR) / 2}, (_, i) => i).map(h => (
              <div key={h} className="w-px h-full bg-gray-200/70"></div>
          ))}
        </div>

        {/* Bookings */}
        <div className="relative h-full">
          {sortedBookings.map((booking, index) => {
            const left = getPosition(booking.startTime);
            const width = getWidth(booking.startTime, booking.endTime);
            const color = bookingColors[index % bookingColors.length];
            return (
              <div
                key={booking.id}
                className={`absolute h-8 ${color} rounded-lg shadow-md border border-white/50`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  top: 0,
                  minWidth: '5px'
                }}
                title={`${booking.customerName} (${booking.startTime} - ${booking.endTime})`}
              >
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};