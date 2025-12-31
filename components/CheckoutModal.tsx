
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Booking } from '../types';

interface CheckoutModalProps {
  booking: Booking;
  productSalesEnabled: boolean;
  onClose: () => void;
  onConfirm: (booking: Booking, details: { amount: number, productAmount: number, notes: string }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ booking, productSalesEnabled, onClose, onConfirm }) => {
  const [amount, setAmount] = useState(booking.amount || '');
  const [productAmount, setProductAmount] = useState(booking.productAmount || '');
  const [notes, setNotes] = useState(booking.checkoutNotes || '');
  
  const total = Number(amount || 0) + (productSalesEnabled ? Number(productAmount || 0) : 0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(amount === '' || isNaN(Number(amount))) {
        alert('請輸入有效的服務金額');
        return;
    }
    onConfirm(booking, {
        amount: Number(amount),
        productAmount: productSalesEnabled ? Number(productAmount || 0) : 0,
        notes,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">結帳 - {booking.customerName}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`grid ${productSalesEnabled ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                 <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text-light))]">服務金額 *</label>
                    <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full px-4 py-3 mt-1 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]" />
                </div>
                {productSalesEnabled && (
                 <div>
                    <label className="block text-sm font-medium text-[rgb(var(--color-text-light))]">商品金額</label>
                    <input type="number" inputMode="numeric" value={productAmount} onChange={(e) => setProductAmount(e.target.value)} className="w-full px-4 py-3 mt-1 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]" />
                </div>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-[rgb(var(--color-text-light))]">結帳備註</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-4 py-3 mt-1 bg-white border border-[rgb(var(--color-border))] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]" placeholder="記錄使用的商品、折扣等"></textarea>
            </div>
            <div className="pt-2 text-right">
                <p className="text-lg font-bold">總計: <span className="text-[rgb(var(--color-primary))]">${total.toLocaleString()}</span></p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-[rgb(var(--color-text))] bg-white border border-[rgb(var(--color-border))] rounded-lg hover:bg-gray-100 transition-colors">取消</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-[rgb(var(--color-accent-2))] rounded-lg shadow-md hover:opacity-90 transition-colors">確認金額</button>
            </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
