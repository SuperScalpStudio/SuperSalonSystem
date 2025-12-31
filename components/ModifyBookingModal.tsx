
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Booking } from '../types';
import { SERVICES } from '../constants';

interface ModifyBookingModalProps {
  booking: Booking;
  onClose: () => void;
  onSave: (booking: Booking) => void;
  serviceDurations: { [key: string]: number };
}

const MAIN_SERVICES = ['剪髮', '染髮', '燙髮', '護髮', '頭皮保養'];

export const ModifyBookingModal: React.FC<ModifyBookingModalProps> = ({ booking, onClose, onSave, serviceDurations }) => {
  const [date, setDate] = useState(String(booking.date).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
  const [hour, setHour] = useState(String(booking.startTime).split(':')[0]);
  const [minute, setMinute] = useState(String(booking.startTime).split(':')[1]);
  const [selectedServices, setSelectedServices] = useState<string[]>(booking.services);
  const [notes, setNotes] = useState(booking.notes);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleServiceToggle = (serviceName: string) => {
    setSelectedServices(prev => {
      const isSelected = prev.includes(serviceName);
      if (isSelected) return prev.filter(s => s !== serviceName);
      if (serviceName === '洗髮') {
        const otherServices = prev.filter(s => !MAIN_SERVICES.includes(s));
        return ['洗髮', ...otherServices];
      }
      if (MAIN_SERVICES.includes(serviceName)) {
        const washRemoved = prev.filter(s => s !== '洗髮');
        return [...washRemoved, serviceName];
      }
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

    const updatedBooking: Booking = {
      ...booking,
      date: date.replace(/-/g, ''),
      startTime: `${hour}:${minute}`,
      endTime: `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`,
      startMs: startDateTime.getTime(),
      endMs: endDateTime.getTime(),
      services: selectedServices,
      notes,
    };
    onSave(updatedBooking);
  };

  return createPortal(
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">修改預約 - {booking.customerName}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-[rgb(var(--color-text-light))] mb-1">預約日期與時間</label>
                <div className="flex items-center space-x-2">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]" />
                    <select value={hour} onChange={e => setHour(e.target.value)} className="w-28 px-4 py-3 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]">
                        {Array.from({ length: 24 }, (_, i) => i).map(h => (
                            <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</option>
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
                    {SERVICES.map(service => (
                        <button key={service.name} type="button" onClick={() => handleServiceToggle(service.name)} className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${selectedServices.includes(service.name) ? 'bg-[rgb(var(--color-primary))] text-white shadow-md' : 'bg-gray-100 text-[rgb(var(--color-text-light))] hover:bg-gray-200'}`}>
                            {service.name}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-[rgb(var(--color-text-light))]">預約備註</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-4 py-3 mt-1 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]" placeholder="本次預約特別注意事項"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-[rgb(var(--color-text))] bg-white border border-[rgb(var(--color-border))] rounded-lg hover:bg-gray-100 transition-colors">取消</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-[rgb(var(--color-primary))] rounded-lg shadow-md hover:opacity-90 transition-colors">儲存修改</button>
            </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
