
import React from 'react';
import { formatCurrency } from '@/api/api';

interface ReceiptPreviewProps {
  transaction: {
    id: string;
    date: string;
    items: {
      productName: string;
      quantity: number;
      price: number;
      subtotal: number;
    }[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    amountPaid?: number;
    change?: number;
  };
  storeInfo: {
    name: string;
    address: string;
    whatsapp: string;
    notes?: string;
  };
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ transaction, storeInfo }) => {
  return (
    <div 
      className="bg-white text-black p-4 rounded-lg shadow-lg w-[58mm] mx-auto font-mono text-xs" 
      style={{ 
        width: '58mm', 
        maxWidth: '58mm', 
        minWidth: '58mm',
        wordBreak: 'break-word' 
      }}
    >
      {/* Store Header */}
      <div className="text-center mb-2">
        <h1 className="text-sm font-bold">{storeInfo.name}</h1>
        <p className="text-[10px] text-gray-600">{storeInfo.address}</p>
        <p className="text-[10px] text-gray-600">WA: {storeInfo.whatsapp}</p>
      </div>
      
      {/* Transaction Info */}
      <div className="mb-2 text-[10px]">
        <p>Trx: #{transaction.id}</p>
        <p>Date: {transaction.date}</p>
        <p>Payment: {transaction.paymentMethod}</p>
      </div>
      
      {/* Divider */}
      <div className="border-t border-dashed border-gray-300 my-2"></div>
      
      {/* Items Header */}
      <div className="grid grid-cols-12 font-bold mb-1 text-[10px]">
        <div className="col-span-6">Item</div>
        <div className="col-span-2 text-center">Qty</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-2 text-right">Total</div>
      </div>
      
      {/* Items */}
      {transaction.items.map((item, index) => (
        <div key={index} className="grid grid-cols-12 mb-1 text-[10px]">
          <div className="col-span-6 truncate">{item.productName}</div>
          <div className="col-span-2 text-center">{item.quantity}</div>
          <div className="col-span-2 text-right">{formatCurrency(item.price).replace('Rp', '')}</div>
          <div className="col-span-2 text-right">{formatCurrency(item.subtotal).replace('Rp', '')}</div>
        </div>
      ))}
      
      {/* Divider */}
      <div className="border-t border-dashed border-gray-300 my-2"></div>
      
      {/* Totals */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="text-right">Subtotal:</div>
        <div className="text-right">{formatCurrency(transaction.subtotal)}</div>
        
        <div className="text-right">Tax:</div>
        <div className="text-right">{formatCurrency(transaction.tax)}</div>
        
        <div className="text-right font-bold">TOTAL:</div>
        <div className="text-right font-bold">{formatCurrency(transaction.total)}</div>
      </div>
      
      {/* Payment details for cash */}
      {transaction.paymentMethod.toLowerCase() === 'cash' && transaction.amountPaid !== undefined && (
        <>
          <div className="border-t border-dashed border-gray-300 my-2"></div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="text-right">Cash:</div>
            <div className="text-right">{formatCurrency(transaction.amountPaid)}</div>
            
            {transaction.change !== undefined && (
              <>
                <div className="text-right">Change:</div>
                <div className="text-right">{formatCurrency(transaction.change)}</div>
              </>
            )}
          </div>
        </>
      )}
      
      {/* Footer */}
      <div className="border-t border-dashed border-gray-300 my-2"></div>
      <div className="text-center text-[10px] text-gray-600">
        <p>{storeInfo.notes || 'Thank you for your purchase!'}</p>
      </div>
    </div>
  );
};

export default ReceiptPreview;
