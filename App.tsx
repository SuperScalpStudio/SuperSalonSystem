
import React, { useState, useEffect, useCallback } from 'react';
import type { User, Booking, Customer, AppSettings } from './types';
import { Page, BookingStatus } from './types';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { BookingPage } from './components/BookingPage';
import { CustomersPage } from './components/CustomersPage';
import { ReportsPage } from './components/ReportsPage';
import { SettingsPage } from './components/SettingsPage';
import { api } from './utils/googleSheetSync';
import { SERVICES } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>(Page.Booking);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    serviceDurations: Object.fromEntries(SERVICES.map(s => [s.name, s.durationMinutes])),
    productSalesEnabled: true,
  });

  const fetchInitialData = async (url: string, sheetId: string) => {
    if (!url || !sheetId) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const [cRes, bRes] = await Promise.all([
        api.fetchData(url, sheetId, 'customers'),
        api.fetchData(url, sheetId, 'bookings')
      ]);
      if (cRes.success) setCustomers(cRes.data || []);
      if (bRes.success) setBookings(bRes.data || []);
    } catch (err) {
      console.error('Initial fetch failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as User;
      setUser(parsedUser);
      if (parsedUser.googleSheetUrl && parsedUser.sheetId) {
        fetchInitialData(parsedUser.googleSheetUrl, parsedUser.sheetId);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (loggedUser: User, masterUrl?: string) => {
    const targetUrl = loggedUser.googleSheetUrl || masterUrl;
    const cleanName = loggedUser.name.replace(/^'/, '');
    const userWithUrl = { ...loggedUser, name: cleanName, googleSheetUrl: targetUrl };
    
    setUser(userWithUrl);
    localStorage.setItem('user', JSON.stringify(userWithUrl));
    
    if (targetUrl && userWithUrl.sheetId) {
      fetchInitialData(targetUrl, userWithUrl.sheetId);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCustomers([]);
    setBookings([]);
    setIsSettingsOpen(false);
  };

  const sync = useCallback(async (type: 'bookings' | 'customers', data: any[]) => {
    if (!user?.googleSheetUrl || !user?.sheetId) return;
    try {
        await api.syncData(user.googleSheetUrl, user.sheetId, type, data);
    } catch (e) {
        console.error(`Sync failed (${type}):`, e);
    }
  }, [user]);

  const handleAddCustomer = (customer: Customer) => {
    const newCustomers = [customer, ...customers];
    setCustomers(newCustomers);
    sync('customers', newCustomers);
  };

  const handleUpdateCustomer = (updated: Customer) => {
    const newCustomers = customers.map(c => c.id === updated.id ? updated : c);
    setCustomers(newCustomers);
    sync('customers', newCustomers);
  };

  const handleAddBooking = (booking: Booking) => {
    const newBookings = [booking, ...bookings];
    setBookings(newBookings);
    sync('bookings', newBookings);
  };

  const handleUpdateBooking = (updated: Booking) => {
    const oldBooking = bookings.find(b => b.id === updated.id);
    const newBookings = bookings.map(b => b.id === updated.id ? updated : b);
    setBookings(newBookings);
    sync('bookings', newBookings);

    const isModification = oldBooking && oldBooking.status === BookingStatus.Booked && updated.status === BookingStatus.Booked;
    updateCustomerStats(updated.customerId, newBookings, isModification);
  };

  const updateCustomerStats = (customerId: string, latestBookings: Booking[], isModifyAction: boolean = false) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const cBookings = latestBookings.filter(b => b.customerId === customerId);
    const stats = {
        statsVisits: cBookings.filter(b => b.status === BookingStatus.Paid).length,
        statsAmount: cBookings.reduce((sum, b) => sum + (b.amount || 0) + (b.productAmount || 0), 0),
        statsCancel: cBookings.filter(b => b.status === BookingStatus.Canceled).length,
        statsNoShow: cBookings.filter(b => b.status === BookingStatus.NoShow).length,
        statsModify: isModifyAction ? (customer.statsModify + 1) : customer.statsModify
    };

    handleUpdateCustomer({ ...customer, ...stats });
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDFAF5]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#577E89]/20 border-t-[#577E89] rounded-full animate-spin"></div>
          <p className="text-[#577E89] font-black tracking-widest animate-pulse">載入系統中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))] flex flex-col max-w-lg mx-auto shadow-2xl relative">
      <Header user={user} onSettingsClick={() => setIsSettingsOpen(true)} />
      
      <main className="flex-1 overflow-hidden">
        <div className={`h-full animate-page-enter ${activePage === Page.Booking ? 'block' : 'hidden'}`}>
          <BookingPage 
            customers={customers} 
            bookings={bookings} 
            settings={settings}
            onAddBooking={handleAddBooking}
            onAddCustomer={handleAddCustomer}
            onUpdateBooking={handleUpdateBooking}
            onUpdateCustomer={handleUpdateCustomer}
          />
        </div>
        
        <div className={`h-full animate-page-enter ${activePage === Page.Customers ? 'block' : 'hidden'}`}>
          <CustomersPage 
            customers={customers} 
            bookings={bookings} 
            settings={settings}
            onUpdateCustomer={handleUpdateCustomer}
            onUpdateBooking={handleUpdateBooking}
            onAddBooking={handleAddBooking}
          />
        </div>

        <div className={`h-full animate-page-enter ${activePage === Page.Reports ? 'block' : 'hidden'}`}>
          <ReportsPage 
            bookings={bookings} 
            onUpdateBooking={handleUpdateBooking}
            settings={settings}
          />
        </div>
      </main>

      <BottomNav activePage={activePage} setActivePage={setActivePage} />

      {isSettingsOpen && (
        <SettingsPage 
          user={user}
          settings={settings}
          onLogout={handleLogout}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateSettings={setSettings}
        />
      )}
    </div>
  );
};

export default App;
