
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
    <div className="bg-white text-black p-8 rounded-lg shadow-lg max-w-md mx-auto font-mono text-sm">
      {/* Store Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">{storeInfo.name}</h1>
        <p className="text-gray-600">{storeInfo.address}</p>
        <p className="text-gray-600">WhatsApp: {storeInfo.whatsapp}</p>
      </div>
      
      {/* Transaction Info */}
      <div className="mb-4">
        <p><span className="font-semibold">Transaction:</span> #{transaction.id}</p>
        <p><span className="font-semibold">Date:</span> {transaction.date}</p>
        <p><span className="font-semibold">Payment:</span> {transaction.paymentMethod}</p>
      </div>
      
      {/* Divider */}
      <div className="border-t border-dashed border-gray-300 my-4"></div>
      
      {/* Items Header */}
      <div className="grid grid-cols-12 font-bold mb-2">
        <div className="col-span-6">Item</div>
        <div className="col-span-2 text-center">Qty</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-2 text-right">Total</div>
      </div>
      
      {/* Items */}
      {transaction.items.map((item, index) => (
        <div key={index} className="grid grid-cols-12 mb-1">
          <div className="col-span-6 truncate">{item.productName}</div>
          <div className="col-span-2 text-center">{item.quantity}</div>
          <div className="col-span-2 text-right">{formatCurrency(item.price).replace('Rp', '')}</div>
          <div className="col-span-2 text-right">{formatCurrency(item.subtotal).replace('Rp', '')}</div>
        </div>
      ))}
      
      {/* Divider */}
      <div className="border-t border-dashed border-gray-300 my-4"></div>
      
      {/* Totals */}
      <div className="grid grid-cols-2 gap-2">
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
          <div className="border-t border-dashed border-gray-300 my-4"></div>
          <div className="grid grid-cols-2 gap-2">
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
      <div className="border-t border-dashed border-gray-300 my-4"></div>
      <div className="text-center text-gray-600">
        <p>{storeInfo.notes || 'Thank you for your purchase!'}</p>
      </div>
    </div>
  );
};

export default ReceiptPreview;
