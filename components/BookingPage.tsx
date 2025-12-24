
import React, { useState, useEffect } from 'react';
import type { Customer, Booking, AppSettings } from '../types';
import { BookingStatus } from '../types';
import { CustomerInfoCard } from './CustomerInfoCard';
import { NewCustomerForm } from './NewCustomerForm';
import { RecentBookingsList } from './RecentBookingsList';
import { CalendarView } from './CalendarView';
import { SearchIcon } from './Icons';
import { ModifyBookingModal } from './ModifyBookingModal';
import { NewBookingModal } from './NewBookingModal';
import { CustomerBookingsModal } from './CustomerBookingsModal';
import { CustomerEditModal } from './CustomerEditModal';
import { ActionConfirmationModal } from './ActionConfirmationModal';
import { CheckoutModal } from './CheckoutModal';

enum ViewMode {
  List = 'list',
  Calendar = 'calendar',
}

interface BookingPageProps {
  customers: Customer[];
  bookings: Booking[];
  settings: AppSettings;
  onAddBooking: (booking: Booking) => void;
  onAddCustomer: (customer: Customer) => void;
  onUpdateBooking: (booking: Booking) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({ 
    customers, 
    bookings, 
    settings, 
    onAddBooking, 
    onAddCustomer, 
    onUpdateBooking, 
    onUpdateCustomer
}) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [searchedPhone, setSearchedPhone] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [customerNotFound, setCustomerNotFound] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.List);
  
  const [modifyingBooking, setModifyingBooking] = useState<Booking | null>(null);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [viewingBookingsFor, setViewingBookingsFor] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [checkingOutBooking, setCheckingOutBooking] = useState<Booking | null>(null);
  
  const [confirmAction, setConfirmAction] = useState<{ type: 'cancel' | 'checkout' | 'save_new' | 'save_modify' | 'noshow', bookingId?: string, payload?: any } | null>(null);

  useEffect(() => {
    if (selectedCustomer) {
      const bookingsForCustomer = bookings
        .filter(b => b.customerId === selectedCustomer.id)
        .sort((a, b) => b.startMs - a.startMs)
        .slice(0, 5);
      setCustomerBookings(bookingsForCustomer);
    } else {
      setCustomerBookings([]);
    }
  }, [selectedCustomer, bookings]);

  useEffect(() => {
      if (selectedCustomer) {
          const updated = customers.find(c => c.id === selectedCustomer.id);
          if (updated) setSelectedCustomer(updated);
      }
  }, [customers]);

  const validatePhone = (phoneNumber: string): boolean => {
    if (!/^09\d{8}$/.test(phoneNumber)) {
      setError('請輸入正確的 10 碼手機號碼');
      return false;
    }
    setError('');
    return true;
  }

  const handleSearch = () => {
    if (!validatePhone(phone)) return;
    setSearchedPhone(phone);
    setShowNewCustomerForm(false);
    setSelectedCustomer(null);
    setCustomerNotFound(false);
    const foundCustomer = customers.find(c => c.phone === phone);
    if (foundCustomer) setSelectedCustomer(foundCustomer);
    else setCustomerNotFound(true);
  };

  const handleCreateCustomer = (newCustomer: Customer) => {
    onAddCustomer(newCustomer);
    setSelectedCustomer(newCustomer);
    setShowNewCustomerForm(false);
    setCustomerNotFound(false);
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    setPhone(numericValue);
    if(error) setError('');
  };

  const handleConfirmAction = () => {
      if (!confirmAction) return;

      if (confirmAction.type === 'cancel' && confirmAction.bookingId) {
          const booking = bookings.find(b => b.id === confirmAction.bookingId);
          if (booking) onUpdateBooking({ ...booking, status: BookingStatus.Canceled });
      } else if (confirmAction.type === 'noshow' && confirmAction.bookingId) {
          const booking = bookings.find(b => b.id === confirmAction.bookingId);
          if (booking) onUpdateBooking({ ...booking, status: BookingStatus.NoShow });
      } else if (confirmAction.type === 'checkout' && confirmAction.payload) {
          const { booking, details } = confirmAction.payload;
          onUpdateBooking({
            ...booking,
            status: BookingStatus.Paid,
            amount: details.amount,
            productAmount: details.productAmount,
            checkoutNotes: details.notes
          });
          setCheckingOutBooking(null);
      } else if (confirmAction.type === 'save_new' && confirmAction.payload) {
          onAddBooking(confirmAction.payload);
          setIsNewBookingModalOpen(false);
      } else if (confirmAction.type === 'save_modify' && confirmAction.payload) {
          onUpdateBooking(confirmAction.payload);
          setModifyingBooking(null);
      }
      setConfirmAction(null);
  };

  const handleSaveModificationRequest = (updatedBooking: Booking) => {
    setConfirmAction({ type: 'save_modify', payload: updatedBooking });
  };
  
  const handleNewBookingSaveRequest = (newBooking: Booking) => {
    setConfirmAction({ type: 'save_new', payload: newBooking });
  };

  const handlePreCheckout = (booking: Booking, details: { amount: number, productAmount: number, notes: string }) => {
      setConfirmAction({ type: 'checkout', payload: { booking, details } });
  };
  
  const getConfirmationMessage = () => {
        if (!confirmAction) return '';
        if (confirmAction.type === 'checkout' && confirmAction.payload) {
            const { details } = confirmAction.payload;
            return `服務 $${details.amount} + 商品 $${details.productAmount} \n總計 $${details.amount + details.productAmount}${details.notes ? '\n\n備註：'+details.notes : ''}`;
        }
        if (confirmAction.type === 'save_new') return '確定要建立這筆新的預約嗎？';
        if (confirmAction.type === 'save_modify') return '確定要儲存修改後的預約內容嗎？';
        if (confirmAction.type === 'cancel') return '確定要取消這筆預約嗎？此動作無法復原。';
        if (confirmAction.type === 'noshow') return '確定要將此預約標示為「未到」嗎？';
        return '';
  };

  const renderListView = () => (
    <div className="p-4 space-y-6 relative pb-24">
      <div className="flex space-x-2">
        <div className="flex-grow">
            <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="輸入顧客手機號碼 (10碼)"
            maxLength={10}
            className={`w-full px-4 h-11 bg-white border ${error ? 'border-red-500' : 'border-[rgb(var(--color-border))]'} rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all duration-200 text-sm`}
            />
            {error && <p className="text-[10px] text-red-500 mt-1 ml-1">{error}</p>}
        </div>
        <button
          onClick={handleSearch}
          className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-[rgb(var(--color-primary))] text-white rounded-xl shadow-lg hover:opacity-90 transform active:scale-95 transition-all self-start"
        >
          <SearchIcon className="w-5 h-5" />
        </button>
      </div>

      {selectedCustomer && (
        <>
          <CustomerInfoCard 
            customer={selectedCustomer} 
            onAddBooking={() => setIsNewBookingModalOpen(true)}
            onViewBookings={() => setViewingBookingsFor(selectedCustomer)}
            onEdit={() => setEditingCustomer(selectedCustomer)}
          />
          <RecentBookingsList 
            bookings={customerBookings} 
            onModify={setModifyingBooking}
            onCancel={(id) => setConfirmAction({ type: 'cancel', bookingId: id })}
          />
        </>
      )}

      {customerNotFound && !showNewCustomerForm && (
        <div className="p-4 text-center bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-lg shadow-md transition-all duration-300">
          <p className="font-bold text-xs">查無此電話：{searchedPhone}</p>
          <div className="mt-3 flex flex-col gap-2">
            <button onClick={() => { setPhone(''); setCustomerNotFound(false); setSearchedPhone(null); }} className="w-full py-2 text-[11px] font-black text-[rgb(var(--color-text))] bg-white border border-[rgb(var(--color-border))] rounded-lg hover:bg-gray-100 transition-colors">重新輸入</button>
            <button onClick={() => setShowNewCustomerForm(true)} className="w-full py-2 text-[11px] font-black text-white bg-[rgb(var(--color-primary))] border border-transparent rounded-lg hover:opacity-90 transition-colors">以此電話建立新顧客</button>
          </div>
        </div>
      )}

      {showNewCustomerForm && searchedPhone && (
          <NewCustomerForm phone={searchedPhone} onCreateCustomer={handleCreateCustomer} onCancel={() => setShowNewCustomerForm(false)} />
      )}
    </div>
  );

  return (
    <div className="relative h-full flex flex-col">
      <div className="p-2 bg-[rgb(var(--color-bg))] sticky top-0 z-10 flex justify-center">
        <div className="inline-flex rounded-full bg-gray-100 p-0.5 w-full max-w-xs shadow-inner">
            <button onClick={() => setViewMode(ViewMode.List)} className={`flex-1 py-1 text-[10px] font-black rounded-full transition-all ${viewMode === ViewMode.List ? 'bg-white text-[#577E89] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>電話查詢</button>
            <button onClick={() => setViewMode(ViewMode.Calendar)} className={`flex-1 py-1 text-[10px] font-black rounded-full transition-all ${viewMode === ViewMode.Calendar ? 'bg-white text-[#577E89] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>月曆瀏覽</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {viewMode === ViewMode.List ? renderListView() : <CalendarView bookings={bookings} onModifyBooking={setModifyingBooking} onCancelBooking={(id) => setConfirmAction({ type: 'cancel', bookingId: id })} />}
      </div>
      
      {checkingOutBooking && <CheckoutModal booking={checkingOutBooking} productSalesEnabled={settings.productSalesEnabled} onClose={() => setCheckingOutBooking(null)} onConfirm={handlePreCheckout} />}
      {modifyingBooking && <ModifyBookingModal booking={modifyingBooking} onClose={() => setModifyingBooking(null)} onSave={handleSaveModificationRequest} serviceDurations={settings.serviceDurations} />}
      {isNewBookingModalOpen && selectedCustomer && <NewBookingModal customer={selectedCustomer} onClose={() => setIsNewBookingModalOpen(false)} onBookingSaved={handleNewBookingSaveRequest} serviceDurations={settings.serviceDurations} />}
      {viewingBookingsFor && (
        <CustomerBookingsModal 
            customer={viewingBookingsFor} 
            bookings={bookings.filter(b => b.customerId === viewingBookingsFor.id)} 
            onClose={() => setViewingBookingsFor(null)} 
            onModify={setModifyingBooking} 
            onCancel={(id) => setConfirmAction({ type: 'cancel', bookingId: id })} 
        />
      )}
      {editingCustomer && <CustomerEditModal customer={editingCustomer} onSave={(updated) => { onUpdateCustomer(updated); setEditingCustomer(null); }} onClose={() => setEditingCustomer(null)} />}
      
      {confirmAction && (
          <ActionConfirmationModal 
            title={confirmAction.type === 'cancel' ? '取消預約' : confirmAction.type === 'noshow' ? '標示未到' : (confirmAction.type === 'checkout' ? '確認結帳' : (confirmAction.type === 'save_new' ? '建立預約' : '儲存修改'))}
            message={getConfirmationMessage()}
            confirmText={(confirmAction.type === 'cancel' || confirmAction.type === 'noshow') ? '確定' : '確認儲存'}
            variant={confirmAction.type === 'cancel' ? 'danger' : confirmAction.type === 'noshow' ? 'warning' : 'info'}
            onConfirm={handleConfirmAction}
            onCancel={() => setConfirmAction(null)}
          />
      )}
    </div>
  );
};
