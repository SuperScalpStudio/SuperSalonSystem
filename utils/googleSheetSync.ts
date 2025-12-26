
import type { User, Booking, Customer } from '../types';

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  user?: User;
  error?: string;
  exists?: boolean; 
}

const forceText = (val: any): string => {
    if (val === undefined || val === null) return '';
    const s = String(val).replace(/^'/, ''); 
    return `'${s}`;
};

const cleanText = (val: any): string => {
    if (val === undefined || val === null) return '';
    if (typeof val !== 'string') return String(val || '');
    return val.replace(/^'/, '');
};

const sendRequest = async (url: string, payload: any): Promise<ApiResponse> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
      },
    });
    
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const json = await response.json();
    return json;
  } catch (error) {
    console.error("API Request Error:", error);
    return { success: false, message: '網路連線錯誤' };
  }
};

/**
 * 歸一化手機號碼：確保字串形式，不在此處做補0，交由前端輸入限制 (10碼)。
 * 但在讀取時會確保移除 '。
 */
const normalizePhone = (phone: string | number): string => {
    if (!phone) return '';
    return cleanText(phone).trim();
};

const sanitizeUser = (user?: any): User | undefined => {
    if (!user) return undefined;
    const sheetId = user.sheetId || user.spreadsheetId || user.SpreadsheetId;
    return {
        ...user,
        phone: normalizePhone(user.phone),
        name: cleanText(user.name),
        googleSheetUrl: user.googleSheetUrl || user.googleSheetURL || user.url,
        sheetId: sheetId ? String(sheetId).trim().replace(/^'/, '') : undefined
    };
};

export const api = {
  checkUserAvailability: async (url: string, phone: string): Promise<{ isAvailable: boolean, message: string, error?: boolean }> => {
      const result = await sendRequest(url, {
          action: 'check_user',
          phone: forceText(normalizePhone(phone)) // 查詢時也帶 ' 確保匹配
      });
      if (result.success && typeof result.exists === 'boolean') {
          return { isAvailable: !result.exists, message: result.exists ? '帳號已註冊' : '此號碼可註冊' };
      }
      return { isAvailable: false, message: '無法驗證帳號狀態', error: true };
  },

  register: async (url: string, data: { phone: string, password: string, name: string }) => {
    const res = await sendRequest(url, {
      action: 'register',
      phone: forceText(data.phone),
      password: forceText(data.password), // 保持明文
      name: forceText(data.name)
    });
    if (res.success && res.user) res.user = sanitizeUser(res.user);
    return res;
  },

  login: async (url: string, data: { phone: string, password: string }) => {
    const res = await sendRequest(url, {
      action: 'login',
      phone: forceText(normalizePhone(data.phone)), // 登入查詢也帶 '
      password: data.password // 保持明文
    });
    if (res.success && res.user) res.user = sanitizeUser(res.user);
    return res;
  },
  
  changePassword: async (url: string, data: { phone: string, oldPassword: string, newPassword: string }) => {
    return sendRequest(url, {
        action: 'change_password',
        phone: forceText(normalizePhone(data.phone)),
        oldPassword: data.oldPassword,
        newPassword: forceText(data.newPassword)
    });
  },

  syncData: async (url: string, sheetId: string, type: 'bookings' | 'customers', data: Booking[] | Customer[]) => {
    if (!sheetId) throw new Error("Sync denied: Missing sheetId");
    
    const payloadData = data.map((item: any) => {
        const newItem = { ...item };
        // 文字欄位強制轉換並補上 ' 前綴，防止 Google Sheets 自動轉換型別
        Object.keys(newItem).forEach(key => {
            if (typeof newItem[key] === 'string') {
                newItem[key] = forceText(newItem[key]);
            }
        });
        
        // 針對特定欄位再次確保 ' 前綴
        if (newItem.date) newItem.date = forceText(newItem.date);
        if (newItem.startTime) newItem.startTime = forceText(newItem.startTime);
        if (newItem.endTime) newItem.endTime = forceText(newItem.endTime);
        if (newItem.birthday) newItem.birthday = forceText(newItem.birthday);
        if (newItem.phone) newItem.phone = forceText(newItem.phone);
        if (newItem.id) newItem.id = forceText(newItem.id);
        
        return newItem;
    });

    return sendRequest(url, {
      action: 'sync',
      sheetId: String(sheetId).trim(),
      operation: 'write',
      type,
      data: payloadData
    });
  },

  fetchData: async (url: string, sheetId: string, type: 'bookings' | 'customers') => {
    const response = await sendRequest(url, {
      action: 'sync',
      sheetId: String(sheetId).trim(),
      operation: 'read',
      type
    });

    if (response.success && Array.isArray(response.data)) {
        response.data = response.data.map((item: any) => {
            const newItem = { ...item };
            
            // 讀取時移除所有欄位的 ' 前綴，還原為原始字串資料
            Object.keys(newItem).forEach(key => {
                if (typeof newItem[key] === 'string') {
                    newItem[key] = cleanText(newItem[key]);
                }
            });
            
            // 轉換數值型態
            if (type === 'customers') {
                newItem.statsVisits = Number(newItem.statsVisits) || 0;
                newItem.statsAmount = Number(newItem.statsAmount) || 0;
                newItem.statsCancel = Number(newItem.statsCancel) || 0;
                newItem.statsNoShow = Number(newItem.statsNoShow) || 0;
                newItem.statsModify = Number(newItem.statsModify) || 0;
            } else if (type === 'bookings') {
                newItem.amount = Number(newItem.amount) || 0;
                newItem.productAmount = Number(newItem.productAmount) || 0;
                newItem.startMs = Number(newItem.startMs);
                newItem.endMs = Number(newItem.endMs);
                newItem.services = Array.isArray(newItem.services) ? newItem.services : 
                                  (typeof newItem.services === 'string' ? newItem.services.split(',') : []);
            }
            return newItem;
        });
    }
    return response;
  }
};
