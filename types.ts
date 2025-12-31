
export interface Product {
  barcode: string;
  name: string;
  quantity: number;
  weightedAverageCost: number;
  lastUpdated: string;
}

export interface TransactionItem {
  barcode: string;
  name: string;
  quantity: number;
  price: number; // 進貨: 台幣成本; 銷貨: 售價
  cost?: number; // 僅銷貨時記錄當時的加權平均成本
  profit?: number; // 僅銷貨時記錄毛利
}

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE'
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  items: TransactionItem[];
  totalAmount: number;
  totalProfit?: number; 
  remarks?: string;
}

export interface InventoryState {
  products: Record<string, Product>;
  transactions: Transaction[];
}
