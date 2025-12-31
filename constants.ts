
import type { Service } from './types';

// ★ 後端 API 網址 (Google Apps Script) ★
export const DEFAULT_API_URL: string = 'https://script.google.com/macros/s/AKfycbyInYvgcMhnkl9vJCf03aZHe1S4IbHgLnmLK9AkyCHw637f-FXX7GFXbPdrSCifJzap/exec'; 

export const SERVICES: Service[] = [
  { name: '洗髮', durationMinutes: 30 },
  { name: '剪髮', durationMinutes: 60 },
  { name: '染髮', durationMinutes: 120 },
  { name: '燙髮', durationMinutes: 180 },
  { name: '護髮', durationMinutes: 60 },
  { name: '頭皮保養', durationMinutes: 90 },
  { name: '其他', durationMinutes: 30 },
];
