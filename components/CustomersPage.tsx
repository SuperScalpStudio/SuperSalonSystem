
import React, { useState } from 'react';
import type { Customer, Booking, AppSettings } from '../types';
import { BookingStatus } from '../types';
import { CustomerEditModal } from './CustomerEditModal';
import { CustomerBookingsModal } from './CustomerBookingsModal';
import { ModifyBookingModal } from './ModifyBookingModal';
import { NewBookingModal } from './NewBookingModal';
import { CustomerInfoCard } from './CustomerInfoCard';
import { SearchIcon } from './Icons';
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
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [viewingBookingsFor, setViewingBookingsFor] = useState<Customer | null>(null);
    const [modifyingBooking, setModifyingBooking] = useState<Booking | null>(null);
    const [addingBookingFor, setAddingBookingFor] = useState<Customer | null>(null);
    
    // 擴充 confirmAction 狀態以支援儲存操作
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

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => b.createdAtMs - a.createdAtMs);
    
    const bookingsForCustomer = viewingBookingsFor 
        ? bookings.filter(b => b.customerId === viewingBookingsFor.id) 
        : [];

    return (
        <>
            <div className="p-4 space-y-4 pb-24">
                <div className="relative">
                    <input 
                        type="search"
                        placeholder="搜尋姓名、電話、備註..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
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
                        <div className="text-center py-16 text-gray-500">
                            <p>找不到符合條件的顧客</p>
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
