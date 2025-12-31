
import React, { useState, useMemo } from 'react';
import type { Customer, Booking, AppSettings } from '../types';
import { BookingStatus } from '../types';
import { CustomerEditModal } from './CustomerEditModal';
import { CustomerBookingsModal } from './CustomerBookingsModal';
import { ModifyBookingModal } from './ModifyBookingModal';
import { NewBookingModal } from './NewBookingModal';
import { CustomerInfoCard } from './CustomerInfoCard';
import { SearchIcon, GiftIcon } from './Icons';
import { ActionConfirmationModal } from './ActionConfirmationModal';

interface CustomersPageProps {
    customers: Customer[];
    bookings: Booking[];
    settings: AppSettings;
    onUpdateCustomer: (customer: Customer) => void;
    onUpdateBooking: (booking: Booking) => void;
    onAddBooking: (booking: Booking) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ customers, bookings, settings, onUpdateCustomer, onUpdateBooking, onAddBooking }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isBirthdayFilter, setIsBirthdayFilter] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [viewingBookingsFor, setViewingBookingsFor] = useState<Customer | null>(null);
    const [modifyingBooking, setModifyingBooking] = useState<Booking | null>(null);
    const [addingBookingFor, setAddingBookingFor] = useState<Customer | null>(null);
    
    const [confirmAction, setConfirmAction] = useState<{ 
        type: 'cancel' | 'noshow' | 'save_new' | 'save_modify', 
        bookingId?: string, 
        payload?: any 
    } | null>(null);

    const handleSaveCustomer = (updatedCustomer: Customer) => {
        onUpdateCustomer(updatedCustomer);
        setEditingCustomer(null);
    };
    
    const handleSaveModificationRequest = (updatedBooking: Booking) => {
        setConfirmAction({ type: 'save_modify', payload: updatedBooking });
    };

    const handleNewBookingSaveRequest = (newBooking: Booking) => {
        setConfirmAction({ type: 'save_new', payload: newBooking });
    };

    const handleConfirmAction = () => {
        if (!confirmAction) return;

        if (confirmAction.type === 'save_new' && confirmAction.payload) {
            onAddBooking(confirmAction.payload);
            setAddingBookingFor(null);
        } else if (confirmAction.type === 'save_modify' && confirmAction.payload) {
            onUpdateBooking(confirmAction.payload);
            setModifyingBooking(null);
        } else if (confirmAction.bookingId) {
            const booking = bookings.find(b => b.id === confirmAction.bookingId);
            if (booking) {
                if (confirmAction.type === 'cancel') {
                    onUpdateBooking({ ...booking, status: BookingStatus.Canceled });
                } else if (confirmAction.type === 'noshow') {
                    onUpdateBooking({ ...booking, status: BookingStatus.NoShow });
                }
            }
        }
        setConfirmAction(null);
    };

    const currentMonth = new Date().getMonth() + 1;

    const filteredCustomers = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase().trim();
        
        return customers.filter(c => {
            // 1. 基本資料比對 (姓名、電話、備註)
            const matchesBasic = 
                c.name.toLowerCase().includes(lowerSearch) ||
                c.phone.includes(lowerSearch) ||
                (c.notes && c.notes.toLowerCase().includes(lowerSearch));
            
            // 2. 服務項目穿透比對 (如果基本資料沒對上，就去翻預約紀錄)
            let matchesService = false;
            if (!matchesBasic && lowerSearch !== '') {
                // 找出該顧客所有的預約項目，看有沒有包含搜尋關鍵字
                const customerBookings = bookings.filter(b => b.customerId === c.id);
                matchesService = customerBookings.some(b => 
                    b.services.some(s => s.toLowerCase().includes(lowerSearch))
                );
            }

            const matchesSearch = matchesBasic || matchesService;
            
            // 3. 生日篩選邏輯
            if (isBirthdayFilter) {
                const isThisMonth = c.birthday && c.birthday.startsWith(`${currentMonth}/`);
                return matchesSearch && isThisMonth;
            }
            
            return matchesSearch;
        }).sort((a,b) => b.createdAtMs - a.createdAtMs);
    }, [customers, bookings, searchTerm, isBirthdayFilter, currentMonth]);
    
    const bookingsForCustomer = viewingBookingsFor 
        ? bookings.filter(b => b.customerId === viewingBookingsFor.id) 
        : [];

    return (
        <>
            <div className="p-4 space-y-4 pb-24">
                {/* 搜尋列與生日篩選按鈕 */}
                <div className="flex gap-2">
                    <div className="relative flex-grow">
                        <input 
                            type="search"
                            placeholder="搜尋姓名、電話、服務項目..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 h-11 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all text-sm"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setIsBirthdayFilter(!isBirthdayFilter)}
                        className={`h-11 px-3 flex items-center gap-1.5 rounded-xl border transition-all active:scale-95 shadow-sm
                            ${isBirthdayFilter 
                                ? 'bg-[#577E89] border-[#577E89] text-white' 
                                : 'bg-white border-[rgb(var(--color-border))] text-gray-400 hover:border-[#577E89]/30'}`}
                    >
                        <GiftIcon className={`w-4 h-4 ${isBirthdayFilter ? 'text-white' : 'text-[#E1A36F]'}`} />
                        <span className={`text-[9px] font-black whitespace-nowrap tracking-tighter ${isBirthdayFilter ? 'text-white' : 'text-gray-500'}`}>本月壽星</span>
                        {isBirthdayFilter && (
                             <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                        )}
                    </button>
                </div>

                <div className="space-y-4">
                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(c => 
                            <CustomerInfoCard 
                                key={c.id} 
                                customer={c} 
                                onEdit={() => setEditingCustomer(c)}
                                onViewBookings={() => setViewingBookingsFor(c)}
                                onAddBooking={() => setAddingBookingFor(c)}
                            />
                        )
                    ) : (
                        <div className="text-center py-16 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold text-sm">
                                {searchTerm !== '' 
                                    ? `找不到符合「${searchTerm}」的顧客`
                                    : (isBirthdayFilter ? `本月 (${currentMonth}月) 尚無壽星顧客` : '目前尚無顧客資料')
                                }
                            </p>
                            {(isBirthdayFilter || searchTerm !== '') && (
                                <button 
                                    onClick={() => { setIsBirthdayFilter(false); setSearchTerm(''); }} 
                                    className="mt-2 text-xs font-black text-[#577E89] underline"
                                >
                                    清除篩選條件
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {editingCustomer && (
                <CustomerEditModal 
                    customer={editingCustomer}
                    onSave={handleSaveCustomer}
                    onClose={() => setEditingCustomer(null)}
                />
            )}

            {viewingBookingsFor && (
                <CustomerBookingsModal
                    customer={viewingBookingsFor}
                    bookings={bookingsForCustomer}
                    onClose={() => setViewingBookingsFor(null)}
                    onModify={setModifyingBooking}
                    onCancel={(id) => setConfirmAction({ type: 'cancel', bookingId: id })}
                />
            )}
            
            {modifyingBooking && (
                <ModifyBookingModal
                    booking={modifyingBooking}
                    onClose={() => setModifyingBooking(null)}
                    onSave={handleSaveModificationRequest}
                    serviceDurations={settings.serviceDurations}
                />
            )}

            {addingBookingFor && (
                <NewBookingModal
                    customer={addingBookingFor}
                    onClose={() => setAddingBookingFor(null)}
                    onBookingSaved={handleNewBookingSaveRequest}
                    serviceDurations={settings.serviceDurations}
                />
            )}

            {confirmAction && (
                <ActionConfirmationModal 
                    title={
                        confirmAction.type === 'cancel' ? "取消預約" : 
                        confirmAction.type === 'noshow' ? "標示未到" :
                        confirmAction.type === 'save_new' ? "建立預約" : "儲存修改"
                    }
                    message={
                        confirmAction.type === 'cancel' ? "確定要取消這筆預約嗎？此動作無法復原。" : 
                        confirmAction.type === 'noshow' ? "確定要將此預約標示為未到嗎？" :
                        confirmAction.type === 'save_new' ? "確定要建立這筆新的預約嗎？" : "確定要儲存修改後的預約內容嗎？"
                    }
                    confirmText="確認"
                    variant={
                        confirmAction.type === 'cancel' ? "danger" : 
                        confirmAction.type === 'noshow' ? "warning" : "info"
                    }
                    onConfirm={handleConfirmAction}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </>
    );
};
