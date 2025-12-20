
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Booking, Customer } from '../types';
import { NewBookingForm } from './NewBookingForm';

interface NewBookingModalProps {
  customer: Customer;
  onClose: () => void;
  onBookingSaved: (booking: Booking) => void;
  serviceDurations: { [key: string]: number };
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({ customer, onClose, onBookingSaved, serviceDurations }) => {
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">新增預約 - {customer.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
        </div>
        <NewBookingForm 
            customer={customer}
            onBookingSaved={onBookingSaved}
            serviceDurations={serviceDurations}
        />
      </div>
       <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>,
    document.body
  );
};
