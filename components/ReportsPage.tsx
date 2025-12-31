
import React, { useState, useMemo } from 'react';
import type { Booking, AppSettings } from '../types';
import { BookingStatus } from '../types';
import { CheckoutModal } from './CheckoutModal';
import { ModifyBookingModal } from './ModifyBookingModal';
import { BookingListItem } from './BookingListItem';
import { ActionConfirmationModal } from './ActionConfirmationModal';
import { getLocalTodayDate } from '../utils/dateUtils';

const SERVICE_COLOR_MAP: Record<string, string> = {
    '洗髮': '#E2D8A5', '剪髮': '#577E89', '染髮': '#6F9F9C',
    '燙髮': '#E1A36F', '護髮': '#DEC484', '頭皮保養': '#8DA399', '其他': '#A0AEC0',
};
const DEFAULT_COLOR = '#CBD5E0';

const StatCard: React.FC<{title: string, amount: string, subtitle?: string}> = ({title, amount, subtitle}) => (
    <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-28 transition-transform hover:scale-[1.02]">
        <p className="text-xs font-black text-gray-600 mb-0">{title}</p>
        {subtitle && <p className="text-[10px] text-gray-500 mb-0.5 font-mono font-bold tracking-tight">{subtitle}</p>}
        <p className="text-2xl font-black text-[#577E89] tracking-tight">{amount}</p>
    </div>
);

const PieChart: React.FC<{ data: { name: string, value: number, percent: number, color: string }[] }> = ({ data }) => {
    let gradientString = data.length === 0 ? '#F3F4F6 0deg 360deg' : '';
    let currentDeg = 0;
    if (data.length > 0) {
        data.forEach((item) => {
            const deg = item.percent * 3.6;
            gradientString += `${item.color} ${currentDeg}deg ${currentDeg + deg}deg, `;
            currentDeg += deg;
        });
        gradientString = gradientString.slice(0, -2);
    }
    const allServices = Object.keys(SERVICE_COLOR_MAP);
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-2">
            <div className="w-32 h-32 rounded-full shadow-inner relative" style={{ background: data.length > 0 ? `conic-gradient(${gradientString})` : gradientString }}>
                <div className="absolute inset-0 m-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-[10px] text-gray-500 font-black">營收占比</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full px-2">
                {allServices.map((serviceName) => {
                    const dataItem = data.find(d => d.name === serviceName);
                    const percent = dataItem ? dataItem.percent : 0;
                    return (
                        <div key={serviceName} className="flex items-center gap-1.5 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: SERVICE_COLOR_MAP[serviceName] }}></div>
                            <span className="font-bold text-gray-700 truncate flex-1">{serviceName}</span>
                            <span className={`text-[10px] font-mono font-black ${percent > 0 ? 'text-[#577E89]' : 'text-gray-300'}`}>{percent}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ServiceRevenueAnalysis: React.FC<{ bookings: Booking[] }> = ({ bookings }) => {
    const stats = useMemo(() => {
        const serviceRevenue: Record<string, number> = {};
        let total = 0;
        bookings.forEach(b => {
            if (b.status === BookingStatus.Paid && b.amount) {
                const count = b.services.length;
                if (count > 0) {
                    const avgAmount = b.amount / count;
                    b.services.forEach(s => {
                        serviceRevenue[s] = (serviceRevenue[s] || 0) + avgAmount;
                        total += avgAmount;
                    });
                }
            }
        });
        const result = Object.entries(serviceRevenue)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value]) => ({ name, value, color: SERVICE_COLOR_MAP[name] || DEFAULT_COLOR }));
        return result.map(item => ({
            ...item,
            percent: total > 0 ? Math.round((item.value / total) * 100) : 0
        })).filter(item => item.percent > 0);
    }, [bookings]);
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-black text-base mb-3 text-[#577E89] border-l-4 border-[#E1A36F] pl-2">服務項目業績占比</h3>
            <PieChart data={stats} />
        </div>
    );
};

const formatDate = (date: Date) => `${(date.getMonth() + 1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}`;
const getWeekRange = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${formatDate(start)} - ${formatDate(end)}`;
}

interface ReportsPageProps {
    bookings: Booking[];
    onUpdateBooking: (booking: Booking) => void;
    settings: AppSettings;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ bookings, onUpdateBooking, settings }) => {
    const [activeTab, setActiveTab] = useState('today');
    const [checkingOutBooking, setCheckingOutBooking] = useState<Booking | null>(null);
    const [modifyingBooking, setModifyingBooking] = useState<Booking | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: 'cancel' | 'noshow' | 'checkout' | 'save_modify', bookingId?: string, payload?: any } | null>(null);
    
    const [startDate, setStartDate] = useState(getLocalTodayDate());
    const [endDate, setEndDate] = useState(getLocalTodayDate());

    const todayStr = getLocalTodayDate();
    const todayYYYYMMDD = todayStr.replace(/-/g, '');
    const todayDateObj = new Date(todayStr);

    const todayBookings = useMemo(() => {
        return bookings.filter(b => b.date === todayYYYYMMDD).sort((a,b) => a.startMs - b.startMs);
    }, [bookings, todayYYYYMMDD]);
    
    const revenueStats = useMemo(() => {
        const todayStart = new Date(todayDateObj);
        todayStart.setHours(0,0,0,0);
        
        const weekStart = new Date(todayStart);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);

        const monthStart = new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), 1);
        const monthEnd = new Date(todayDateObj.getFullYear(), todayDateObj.getMonth() + 1, 1);
        
        let todayRevenue = 0;
        let weekRevenue = 0;
        let monthRevenue = 0;
        
        bookings.forEach(b => {
            if (b.status === BookingStatus.Paid) {
                const totalAmount = (b.amount || 0) + (b.productAmount || 0);
                const bookingDate = new Date(b.startMs);
                
                if (bookingDate.getFullYear() === todayStart.getFullYear() &&
                    bookingDate.getMonth() === todayStart.getMonth() &&
                    bookingDate.getDate() === todayStart.getDate()) {
                     todayRevenue += totalAmount;
                }
                if (bookingDate >= weekStart && bookingDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                    weekRevenue += totalAmount;
                }
                if (bookingDate >= monthStart && bookingDate < monthEnd) {
                    monthRevenue += totalAmount;
                }
            }
        });
        return { todayRevenue, weekRevenue, monthRevenue };
    }, [bookings, todayDateObj]);

    const customRangeRevenue = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

        return bookings.reduce((sum, b) => {
            if (b.status === BookingStatus.Paid && b.startMs >= start.getTime() && b.startMs <= end.getTime()) {
                return sum + (b.amount || 0) + (b.productAmount || 0);
            }
            return sum;
        }, 0);
    }, [startDate, endDate, bookings]);

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
        } else if (confirmAction.type === 'save_modify' && confirmAction.payload) {
            onUpdateBooking(confirmAction.payload);
            setModifyingBooking(null);
        }
        setConfirmAction(null);
    };

    const handlePreCheckout = (booking: Booking, details: { amount: number, productAmount: number, notes: string }) => {
        setConfirmAction({
            type: 'checkout',
            payload: { booking, details }
        });
    };

    const handleSaveModifyRequest = (updated: Booking) => {
        setConfirmAction({ type: 'save_modify', payload: updated });
    };

    const getConfirmationMessage = () => {
        if (!confirmAction) return '';
        if (confirmAction.type === 'checkout' && confirmAction.payload) {
            const { details } = confirmAction.payload;
            return `服務 $${details.amount} + 商品 $${details.productAmount} \n總計 $${details.amount + details.productAmount}${details.notes ? '\n\n備註：'+details.notes : ''}`;
        }
        if (confirmAction.type === 'save_modify') return '確定要儲存修改後的預約內容嗎？';
        if (confirmAction.type === 'cancel') return '確定要取消這筆預約嗎？';
        if (confirmAction.type === 'noshow') return '確定要標示為未到嗎？';
        return '';
    };

    return (
        <div className="relative h-full flex flex-col">
            {/* 頂部 Tab 容器 - 縮減內邊距 */}
            <div className="p-2 bg-[rgb(var(--color-bg))] sticky top-0 z-10 flex justify-center">
                <div className="inline-flex rounded-full bg-gray-100 p-0.5 w-full max-w-xs shadow-inner">
                    <button onClick={() => setActiveTab('today')} className={`flex-1 py-1 text-[10px] font-black rounded-full transition-all ${activeTab === 'today' ? 'bg-white text-[#577E89] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>今日預約</button>
                    <button onClick={() => setActiveTab('revenue')} className={`flex-1 py-1 text-[10px] font-black rounded-full transition-all ${activeTab === 'revenue' ? 'bg-white text-[#577E89] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>營收統計</button>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto px-4 pb-24">
                {activeTab === 'today' ? (
                    <div className="space-y-4 pt-2">
                        {todayBookings.length > 0 ? (
                            <ul className="space-y-3">
                                {todayBookings.map(booking => (
                                    <BookingListItem
                                        key={booking.id}
                                        booking={booking}
                                        actions={{
                                            onModify: setModifyingBooking,
                                            onCancel: (id) => setConfirmAction({ type: 'cancel', bookingId: id }),
                                            onCheckout: setCheckingOutBooking,
                                            onNoShow: (id) => setConfirmAction({ type: 'noshow', bookingId: id })
                                        }}
                                        showCustomerName={true}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500 font-bold text-sm">今日尚無預約</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 gap-3">
                            <StatCard title="本日營收" subtitle={formatDate(todayDateObj)} amount={`$${revenueStats.todayRevenue.toLocaleString()}`} />
                            <StatCard title="本週營收" subtitle={getWeekRange(todayDateObj)} amount={`$${revenueStats.weekRevenue.toLocaleString()}`} />
                            <StatCard title="本月營收" subtitle={`${todayDateObj.getMonth() + 1}月`} amount={`$${revenueStats.monthRevenue.toLocaleString()}`} />
                        </div>
                        <ServiceRevenueAnalysis bookings={bookings} />
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-black text-base mb-3 text-[#577E89] border-l-4 border-[#6F9F9C] pl-2">自訂範圍查詢</h3>
                            <div className="flex items-center space-x-2 mb-3">
                                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if(e.target.value > endDate) setEndDate(e.target.value); }} className="flex-1 p-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#577E89] font-bold text-gray-700 text-sm" />
                                <span className="text-gray-400 font-black">-</span>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="flex-1 p-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#577E89] font-bold text-gray-700 text-sm" />
                            </div>
                            <div className="mt-3 p-3 bg-[#FDFAF5] rounded-xl border border-[#E2D8A5]">
                                <p className="text-[10px] text-gray-600 mb-0.5 text-center font-black">範圍總營業額</p>
                                <p className="text-2xl font-black text-[#E1A36F] text-center">${customRangeRevenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {checkingOutBooking && <CheckoutModal booking={checkingOutBooking} productSalesEnabled={settings.productSalesEnabled} onClose={() => setCheckingOutBooking(null)} onConfirm={handlePreCheckout} />}
            {modifyingBooking && <ModifyBookingModal booking={modifyingBooking} onClose={() => setModifyingBooking(null)} onSave={handleSaveModifyRequest} serviceDurations={settings.serviceDurations} />}
            
            {confirmAction && (
                <ActionConfirmationModal 
                    title={confirmAction.type === 'checkout' ? '確認結帳' : '儲存變更'}
                    message={getConfirmationMessage()}
                    confirmText="確認"
                    variant={confirmAction.type === 'cancel' ? 'danger' : confirmAction.type === 'noshow' ? 'warning' : 'info'}
                    onConfirm={handleConfirmAction}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </div>
    );
};
