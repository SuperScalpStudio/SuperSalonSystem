
import React, { useState } from 'react';
import type { Customer, Booking } from '../types';
import { BookingStatus } from '../types';
import { SERVICES } from '../constants';
import { getLocalTodayDate } from '../utils/dateUtils';

interface NewBookingFormProps {
  customer: Customer;
  onBookingSaved: (booking: Booking) => void;
  serviceDurations: { [key: string]: number };
}

const MAIN_SERVICES = ['剪髮', '染髮', '燙髮', '護髮', '頭皮保養'];

export const NewBookingForm: React.FC<NewBookingFormProps> = ({ customer, onBookingSaved, serviceDurations }) => {
  // 使用 getLocalTodayDate() 確保預設日期是本地的今天
  const [date, setDate] = useState(getLocalTodayDate());
  // Default time set to 00:00 as requested
  const [hour, setHour] = useState('00');
  const [minute, setMinute] = useState('00');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const handleServiceToggle = (serviceName: string) => {
    setSelectedServices(prev => {
      const isSelected = prev.includes(serviceName);
      
      if (isSelected) {
        return prev.filter(s => s !== serviceName);
      }
      
      if (serviceName === '洗髮') {
        // Select '洗髮', deselect all main services
        const otherServices = prev.filter(s => !MAIN_SERVICES.includes(s));
        return ['洗髮', ...otherServices];
      }
      
      if (MAIN_SERVICES.includes(serviceName)) {
        // Select a main service, deselect '洗髮'
        const washRemoved = prev.filter(s => s !== '洗髮');
        return [...washRemoved, serviceName];
      }

      // For '其他' or any other service, just add it
      return [...prev, serviceName];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      alert('請至少選擇一項服務');
      return;
    }

    const startDateTime = new Date(`${date}T${hour}:${minute}:00`);
    const totalDuration = selectedServices.reduce((total, serviceName) => {
        return total + (serviceDurations[serviceName] || 0);
    }, 0);
    
    const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60000);

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      date: date.replace(/-/g, ''),
      startTime: `${hour}:${minute}`,
      endTime: `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`,
      startMs: startDateTime.getTime(),
      endMs: endDateTime.getTime(),
      services: selectedServices,
      notes,
      status: BookingStatus.Booked,
      createdAtMs: Date.now(),
    };
    
    onBookingSaved(newBooking);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-light))] mb-1">預約日期與時間</label>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
            />
            <select value={hour} onChange={e => setHour(e.target.value)} className="w-28 px-4 py-3 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]">
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                  <option key={h} value={String(h).padStart(2, '0')}>
                  {String(h).padStart(2, '0')}
                  </option>
              ))}
            </select>
            <select value={minute} onChange={e => setMinute(e.target.value)} className="w-24 px-4 py-3 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]">
              <option value="00">00</option>
              <option value="30">30</option>
            </select>
          </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[rgb(var(--color-text-light))]">服務項目</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {SERVICES.map(service => {
            const isSelected = selectedServices.includes(service.name);
            const isWashSelected = selectedServices.includes('洗髮');
            const isMainService = MAIN_SERVICES.includes(service.name);
            
            const isDisabled = (isWashSelected && isMainService) || (!isWashSelected && service.name === '洗髮' && selectedServices.some(s => MAIN_SERVICES.includes(s)));

            return (
              <button
                key={service.name}
                type="button"
                onClick={() => handleServiceToggle(service.name)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                  isSelected
                    ? 'bg-[rgb(var(--color-primary))] text-white shadow-md'
                    : 'bg-gray-100 text-[rgb(var(--color-text-light))] hover:bg-gray-200'
                }`}
              >
                {service.name}
              </button>
            );
          })}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[rgb(var(--color-text-light))]">預約備註</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full px-4 py-3 mt-1 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
          placeholder="本次預約特別注意事項"
        ></textarea>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="px-6 py-3 font-semibold text-white bg-[rgb(var(--color-primary))] rounded-xl shadow-lg hover:opacity-90 transform hover:scale-105 transition-transform">
          儲存預約
        </button>
      </div>
    </form>
  );
};
