
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  PackagePlus, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  History,
  Trash2,
  Search,
  Edit2,
  ChevronDown,
  ChevronUp,
  FileText,
  Camera,
  X
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Product, Transaction, TransactionType, InventoryState } from './types';

// --- 配置區 ---
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyl7qt2kIZHw45ghHLCqicGwhRipn36wLE-eHwiua6bSyxApbiEJ7zh0bPvGMkWpk6A/exec'; 

// --- 統一風格定義 ---
const headerBarClass = "h-20 bg-white px-6 rounded-[2rem] border-2 border-slate-100 shadow-sm flex items-center justify-between overflow-hidden";
const inputStandardClass = "w-full pl-11 pr-4 py-3.5 text-sm border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm bg-white hover:border-slate-300";
const numberInputClass = "w-full p-3.5 border-2 border-slate-200 rounded-2xl text-lg font-black outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 shadow-sm bg-white";
const readOnlyInputClass = "w-full px-5 py-3.5 text-sm border-2 border-slate-100 rounded-2xl bg-slate-50 text-slate-500 font-bold shadow-sm flex items-center justify-between";

// --- Shared Components ---

const SyncIndicator = ({ isSyncing }: { isSyncing: boolean }) => (
  <div className={`fixed top-0 left-0 right-0 h-1 z-[100] transition-opacity duration-500 ${isSyncing ? 'opacity-100' : 'opacity-0'}`}>
    <div className="h-full bg-indigo-500 animate-pulse w-full"></div>
  </div>
);

const Navigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const links = [
    { path: '/', icon: <Package size={18} />, label: '庫存' },
    { path: '/purchase', icon: <PackagePlus size={18} />, label: '進貨' },
    { path: '/sale', icon: <ShoppingCart size={18} />, label: '銷貨' },
    { path: '/history', icon: <History size={18} />, label: '貨流' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-400 border-t border-slate-800 flex justify-around items-center h-16 z-50 lg:top-0 lg:bottom-auto lg:h-screen lg:w-20 lg:flex-col lg:justify-start lg:pt-8 lg:gap-8">
      <div className="hidden lg:block mb-4">
        <TrendingUp size={24} className="text-indigo-400" />
      </div>
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`flex flex-col lg:flex-row items-center gap-1 transition-colors ${
            isActive(link.path) ? 'text-white font-bold' : 'hover:text-slate-200'
          }`}
        >
          {link.icon}
          <span className="text-[10px] lg:hidden">{link.label}</span>
        </Link>
      ))}
    </nav>
  );
};

const StatSmall = ({ label, value, color = "" }: any) => (
  <div className="flex-1 text-center py-1 border-r border-slate-100 last:border-0 flex flex-col justify-center h-full">
    <div className="text-slate-400 text-[9px] uppercase font-black tracking-tighter mb-0.5">{label}</div>
    <div className={`text-sm font-black ${color}`}>{value}</div>
  </div>
);

const ScannerModal = ({ onScan, onClose }: { onScan: (data: string) => void, onClose: () => void }) => {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 150 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText: string) => {
        onScan(decodedText);
        html5QrCode.stop().then(() => onClose());
      },
      undefined
    ).catch(err => {
      console.error("Scanner Error:", err);
      alert("無法啟動相機。");
      onClose();
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div id="reader" className="w-full aspect-square bg-black"></div>
        <div className="p-6 text-center">
          <p className="text-slate-500 font-bold text-sm mb-4">對準商品條碼自動識別</p>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
          >
            <X size={18} /> 關閉相機
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Page Components ---

const InventoryHome = ({ state, onUpdateProduct }: { state: InventoryState, onUpdateProduct: (p: Product) => void }) => {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortKey, setSortKey] = useState<'profit' | 'quantity' | 'name'>('profit');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const totalStockValue = Object.values(state.products).reduce((acc, p) => acc + (p.quantity * p.weightedAverageCost), 0);
  const totalProfit = state.transactions.filter(t => t.type === TransactionType.SALE).reduce((acc, t) => acc + (t.totalProfit || 0), 0);

  const getItemStats = (barcode: string) => {
    let profit = 0;
    state.transactions.forEach(t => {
      if (t.type === TransactionType.SALE) {
        t.items.forEach(item => { if (item.barcode === barcode) profit += (item.profit || 0) * item.quantity; });
      }
    });
    return profit;
  };

  const filtered = useMemo(() => {
    return Object.values(state.products)
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search))
      .map(p => ({ ...p, cumulativeProfit: getItemStats(p.barcode) }))
      .sort((a, b) => {
        let valA = 0, valB = 0;
        if (sortKey === 'profit') { valA = a.cumulativeProfit; valB = b.cumulativeProfit; }
        else if (sortKey === 'quantity') { valA = a.quantity; valB = b.quantity; }
        else if (sortKey === 'name') { return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name); }
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [state.products, state.transactions, search, sortKey, sortOrder]);

  const toggleSort = (key: 'profit' | 'quantity' | 'name') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  return (
    <div className="p-4 space-y-4 pb-20 lg:pl-24 animate-in fade-in">
      <div className={headerBarClass + " !px-0"}>
        <StatSmall label="庫存成本" value={`$${Math.round(totalStockValue).toLocaleString()}`} />
        <StatSmall label="累計獲利" value={`$${Math.round(totalProfit).toLocaleString()}`} color="text-indigo-600" />
        <StatSmall label="商品種類" value={`${Object.keys(state.products).length}`} />
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="搜尋條碼或品名..." 
            className={inputStandardClass}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { key: 'profit', label: '依獲利' },
            { key: 'quantity', label: '依庫存' },
            { key: 'name', label: '依名稱' }
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => toggleSort(opt.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border-2 ${
                sortKey === opt.key 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {opt.label}
              {sortKey === opt.key && (sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.barcode} className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition">
            <div className="flex-1">
              <div className="font-bold text-sm text-slate-800">{p.name}</div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{p.barcode}</div>
              <div className="mt-2 flex gap-2 items-center">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${p.quantity < 0 ? 'bg-red-100 text-red-700' : p.quantity <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                  存: {p.quantity}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">成本: ${Math.round(p.weightedAverageCost)}</span>
                <span className="text-[10px] text-indigo-500 font-black ml-auto pr-1">累計利潤: ${Math.round(p.cumulativeProfit)}</span>
              </div>
            </div>
            <button onClick={() => setEditingProduct(p)} className="text-slate-300 hover:text-indigo-600 ml-4 p-2 transition-colors"><Edit2 size={18} /></button>
          </div>
        ))}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-6 space-y-4">
              <h3 className="font-black text-sm border-b border-slate-100 pb-3 text-slate-800">修改商品基礎資料</h3>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">品名</label>
                <input 
                  type="text" 
                  className={inputStandardClass.replace('pl-11', 'pl-4')} 
                  value={editingProduct.name} 
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingProduct(null)} className="flex-1 py-3.5 text-sm font-bold text-slate-500">取消</button>
                <button onClick={() => { onUpdateProduct(editingProduct); setEditingProduct(null); }} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-100">儲存更新</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionForm = ({ type, inventory, onSubmit }: { type: TransactionType, inventory: Record<string, Product>, onSubmit: (items: any[], type: TransactionType, remarks: string) => void }) => {
  const [mode, setMode] = useState<'TWD' | 'EUR'>(type === TransactionType.PURCHASE ? 'EUR' : 'TWD');
  const [items, setItems] = useState<any[]>([]);
  const [remarks, setRemarks] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>(''); 
  const [totalBillTwd, setTotalBillTwd] = useState<string>('');

  const foundProduct = inventory[barcode];

  const handleBarcodeLookup = useCallback((code: string) => {
    setBarcode(code);
    const existing = inventory[code];
    if (existing) {
      setName(existing.name);
    } else {
      if (type === TransactionType.SALE) setName('');
    }
  }, [inventory, type]);

  const addItem = () => {
    const qtyNum = Number(quantity);
    const priceNum = Number(unitPrice);
    if (type === TransactionType.SALE && !foundProduct) return;
    if (!barcode || !name || isNaN(qtyNum) || qtyNum <= 0) return;

    setItems([...items, { barcode, name, quantity: qtyNum, price: priceNum || 0, cost: foundProduct?.weightedAverageCost || 0 }]);
    setBarcode(''); setName(''); setQuantity(''); setUnitPrice('');
  };

  const finalItems = useMemo(() => {
    const billTwdNum = Number(totalBillTwd);
    if (type === TransactionType.PURCHASE) {
      if (mode === 'EUR') {
        const totalEur = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        if (totalEur === 0) return items;
        const factor = billTwdNum / totalEur;
        return items.map(i => ({ ...i, price: i.price * factor })); 
      }
      return items.map(i => ({ ...i, price: i.price }));
    }
    return items.map(i => ({ ...i, price: i.price, profit: i.price - i.cost }));
  }, [items, type, mode, totalBillTwd]);

  const totalCalculated = useMemo(() => {
    if (type === TransactionType.PURCHASE && mode === 'EUR') return Number(totalBillTwd) || 0;
    return items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  }, [items, type, mode, totalBillTwd]);

  return (
    <div className="p-4 pb-20 lg:pl-24 space-y-4 max-w-2xl mx-auto animate-in fade-in">
      {isScannerOpen && <ScannerModal onScan={handleBarcodeLookup} onClose={() => setIsScannerOpen(false)} />}
      
      <div className={headerBarClass}>
        <h2 className="text-lg font-black flex items-center gap-2">
          {type === TransactionType.PURCHASE ? <PackagePlus className="text-indigo-600" /> : <ShoppingCart className="text-green-600" />}
          {type === TransactionType.PURCHASE ? '進貨登記' : '銷貨出單'}
        </h2>
        {type === TransactionType.PURCHASE && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setMode('TWD')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${mode === 'TWD' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>TWD</button>
            <button onClick={() => setMode('EUR')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${mode === 'EUR' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>EUR</button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-6">
        <div className="relative">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">條碼輸入</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                className={inputStandardClass + " text-lg font-mono"}
                value={barcode} 
                onChange={e => handleBarcodeLookup(e.target.value)} 
                placeholder="輸入或相機掃描..." 
                autoFocus 
              />
            </div>
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-all"
            >
              <Camera size={24} />
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">商品名稱</label>
          {type === TransactionType.PURCHASE ? (
            <input 
              type="text" 
              className={inputStandardClass.replace('pl-11', 'pl-5')} 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder={foundProduct ? "自動帶出品名..." : "請輸入新商品名稱..."} 
            />
          ) : (
            <div className={readOnlyInputClass}>
              <span>{name || (barcode ? "查無商品" : "等待掃描...")}</span>
              {foundProduct && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${foundProduct.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  庫存: {foundProduct.quantity}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">數量</label>
            <input 
              type="number" inputMode="numeric" 
              className={numberInputClass} 
              value={quantity} 
              onChange={e => setQuantity(e.target.value)} 
              placeholder="0" 
            />
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase mb-2 block tracking-widest ${type === TransactionType.PURCHASE ? 'text-indigo-500' : 'text-green-500'}`}>
              {type === TransactionType.PURCHASE ? (mode === 'EUR' ? '歐元成本' : '台幣成本') : '單價'}
            </label>
            <input 
              type="number" inputMode="decimal" 
              className={numberInputClass} 
              value={unitPrice} 
              onChange={e => setUnitPrice(e.target.value)} 
              placeholder="0" 
            />
          </div>
        </div>

        <button 
          onClick={addItem} 
          disabled={(type === TransactionType.SALE && !foundProduct) || !quantity || !barcode || !name}
          className={`w-full py-4.5 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg ${((type === TransactionType.SALE && !foundProduct) || !quantity || !barcode || !name) ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white hover:bg-black hover:shadow-xl'}`}
        >
          加入清單
        </button>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase px-2 flex justify-between items-center tracking-widest">
            <span>待處理明細 ({items.length})</span>
            <button onClick={() => setItems([])} className="text-red-400 hover:text-red-600 font-black">清空</button>
          </h3>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl flex justify-between items-center border-2 border-slate-100 shadow-sm">
                <div className="flex-1">
                  <div className="text-sm font-black text-slate-800">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.barcode}</div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-black text-sm text-slate-900">x{item.quantity}</div>
                    <div className="text-[10px] font-bold text-slate-400">${Math.round(item.price)}</div>
                  </div>
                  <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-slate-900 p-7 rounded-[2.5rem] shadow-2xl space-y-5 animate-in slide-in-from-bottom-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest px-2">備註</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="輸入單據備註..." 
                className="w-full pl-11 pr-4 py-3 bg-slate-800 text-white text-sm border-2 border-slate-700 rounded-2xl focus:border-indigo-500 outline-none"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center px-2 border-b border-slate-800 pb-5">
            <span className="text-slate-400 text-xs font-black uppercase">總計</span>
            <span className={`text-3xl font-black ${type === TransactionType.PURCHASE ? 'text-indigo-400' : 'text-green-400'}`}>
              ${Math.round(totalCalculated).toLocaleString()}
            </span>
          </div>
          <button 
            disabled={items.length === 0}
            onClick={() => { onSubmit(finalItems, type, remarks); setItems([]); setRemarks(''); }}
            className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-base active:scale-95 transition-all shadow-xl"
          >
            確認出單
          </button>
        </div>
      )}
    </div>
  );
};

const HistoryLog = ({ transactions }: { transactions: Transaction[] }) => {
  const [itemSearch, setItemSearch] = useState('');
  const filtered = useMemo(() => {
    const list = [...transactions].reverse();
    if (!itemSearch) return list;
    return list.filter(t => t.items.some(i => i.barcode.includes(itemSearch) || i.name.toLowerCase().includes(itemSearch.toLowerCase())));
  }, [transactions, itemSearch]);

  return (
    <div className="p-4 pb-20 lg:pl-24 space-y-6 animate-in fade-in">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" placeholder="搜尋紀錄..." 
          className={inputStandardClass}
          value={itemSearch} onChange={(e) => setItemSearch(e.target.value)}
        />
      </div>
      <div className="space-y-5">
        {filtered.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-2 h-full ${t.type === TransactionType.PURCHASE ? 'bg-indigo-500' : 'bg-green-500'}`} />
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">{t.id}</div>
                <div className="text-xs text-slate-900 font-black">{new Date(t.date).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black">${Math.round(t.totalAmount).toLocaleString()}</div>
                {t.totalProfit !== undefined && (
                  <div className="text-[10px] font-bold text-green-600">獲利 ${Math.round(t.totalProfit)}</div>
                )}
              </div>
            </div>
            {t.remarks && <p className="text-[11px] text-slate-400 italic mb-4">備註: {t.remarks}</p>}
            <div className="space-y-2">
              {t.items.map((item, i) => (
                <div key={i} className="text-xs flex justify-between text-slate-600">
                  <span>{item.name} x{item.quantity}</span>
                  <span className="font-bold">${Math.round(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<InventoryState>({ products: {}, transactions: [] });
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchFromSheet = useCallback(async () => {
    if (!SCRIPT_URL) return;
    setIsSyncing(true);
    try {
      const response = await fetch(SCRIPT_URL);
      const data = await response.json();
      setState(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => { fetchFromSheet(); }, [fetchFromSheet]);

  const syncToSheet = async (newState: InventoryState, lastTransaction: Transaction) => {
    if (!SCRIPT_URL) return;
    setIsSyncing(true);
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ products: newState.products, transaction: lastTransaction })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateProduct = (product: Product) => {
    setState(prev => {
      const newProducts = { ...prev.products, [product.barcode]: { ...product, lastUpdated: new Date().toISOString() } };
      const newState = { ...prev, products: newProducts };
      syncToSheet(newState, { id: 'UP'+Date.now(), date: new Date().toISOString(), type: TransactionType.PURCHASE, items: [], totalAmount: 0 });
      return newState;
    });
  };

  const handleTransaction = (items: any[], type: TransactionType, remarks: string) => {
    setState(prev => {
      const newProducts = { ...prev.products };
      let totalAmount = 0;
      let totalProfit = 0;

      items.forEach(item => {
        totalAmount += item.price * item.quantity;
        const existing = newProducts[item.barcode];
        if (type === TransactionType.PURCHASE) {
          if (existing) {
            const newQty = existing.quantity + item.quantity;
            const newCost = (existing.quantity * existing.weightedAverageCost + item.quantity * item.price) / newQty;
            newProducts[item.barcode] = { ...existing, quantity: newQty, weightedAverageCost: newCost, lastUpdated: new Date().toISOString() };
          } else {
            newProducts[item.barcode] = { barcode: item.barcode, name: item.name, quantity: item.quantity, weightedAverageCost: item.price, lastUpdated: new Date().toISOString() };
          }
        } else {
          if (existing) {
            totalProfit += (item.price - existing.weightedAverageCost) * item.quantity;
            newProducts[item.barcode] = { ...existing, quantity: existing.quantity - item.quantity, lastUpdated: new Date().toISOString() };
          }
        }
      });

      const newTransaction: Transaction = {
        id: (type === TransactionType.PURCHASE ? 'PU' : 'SA') + Date.now(),
        date: new Date().toISOString(), type, items, totalAmount, totalProfit: type === TransactionType.SALE ? totalProfit : undefined, remarks
      };
      const newState = { products: newProducts, transactions: [...prev.transactions, newTransaction] };
      syncToSheet(newState, newTransaction);
      return newState;
    });
  };

  return (
    <Router>
      <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
        <SyncIndicator isSyncing={isSyncing} />
        <Navigation />
        <main className="flex-1 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<InventoryHome state={state} onUpdateProduct={handleUpdateProduct} />} />
            <Route path="/purchase" element={<TransactionForm type={TransactionType.PURCHASE} inventory={state.products} onSubmit={handleTransaction} />} />
            <Route path="/sale" element={<TransactionForm type={TransactionType.SALE} inventory={state.products} onSubmit={handleTransaction} />} />
            <Route path="/history" element={<HistoryLog transactions={state.transactions} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
