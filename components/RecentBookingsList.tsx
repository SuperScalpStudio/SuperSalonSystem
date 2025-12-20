
import React from 'react';
import type { Booking } from '../types';
import { BookingListItem } from './BookingListItem';

interface RecentBookingsListProps {
  bookings: Booking[];
  onModify: (booking: Booking) => void;
  onCancel: (bookingId: string) => void;
}

export const RecentBookingsList: React.FC<RecentBookingsListProps> = ({ bookings, onModify, onCancel }) => {
  if (bookings.length === 0) {
    return (
      <div className="p-8 text-center text-[rgb(var(--color-text-light))] bg-white border border-[rgb(var(--color-border))] rounded-2xl shadow-sm">
        尚無預約紀錄
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 px-1">最近 5 筆預約</h3>
      <ul className="space-y-3">
        {bookings.map(booking => (
          <BookingListItem 
            key={booking.id} 
            booking={booking}
            actions={{
              onModify,
              onCancel
            }}
          />
        ))}
      </ul>
    </div>
  );
};
