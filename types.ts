
export enum Page {
  Booking = 'booking',
  Customers = 'customers',
  Reports = 'reports'
}

export interface User {
  phone: string;
  name: string;
  googleSheetUrl?: string;
  sheetId?: string;
}

export interface Service {
  name: string;
  durationMinutes: number;
}

export enum BookingStatus {
  Booked = 'booked',
  Paid = 'paid',
  Canceled = 'canceled',
  NoShow = 'noshow'
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  startTime: string;
  endTime: string;
  startMs: number;
  endMs: number;
  services: string[];
  notes?: string;
  status: BookingStatus;
  createdAtMs: number;
  amount?: number;
  productAmount?: number;
  checkoutNotes?: string;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  birthday?: string;
  notes?: string;
  statsVisits: number;
  statsAmount: number;
  statsCancel: number;
  statsNoShow: number;
  statsModify: number;
  createdAtMs: number;
}

export interface AppSettings {
  serviceDurations: { [key: string]: number };
  productSalesEnabled: boolean;
  googleSheetUrl?: string;
}
