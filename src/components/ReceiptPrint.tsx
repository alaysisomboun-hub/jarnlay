import React from 'react';
import { SaleOrder, AppSettings } from '../types';
import { Printer, X, CheckCircle, FileText } from 'lucide-react';

interface ReceiptPrintProps {
  sale: SaleOrder;
  settings: AppSettings;
  onClose: () => void;
  formatMoney: (val: number) => string;
}

export const ReceiptPrint: React.FC<ReceiptPrintProps> = ({
  sale,
  settings,
  onClose,
  formatMoney,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isWholesale = sale.orderType === 'wholesale';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=LAO-QR-PAY|ACC:${settings.qrAccountNumber}|AMT:${sale.total}|INV:${sale.invoiceNo}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-base">
              {isWholesale ? 'ໃບສົ່ງເຄື່ອງ / ໃບບິນຂາຍສົ່ງ' : 'ໃບຮັບເງິນ / ໃບບິນຂາຍຍ່ອຍ'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              ພິມໃບບິນ
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex justify-center">
          <div
            id="printable-receipt"
            className="bg-white p-6 shadow-sm border border-slate-200 text-slate-800 text-xs w-[80mm] min-h-[140mm] font-sans"
            style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              <h2 className="text-base font-bold text-slate-900 mb-0.5">{settings.storeName}</h2>
              <p className="text-[11px] text-slate-600">{settings.storeBranch}</p>
              <p className="text-[11px] text-slate-600">ໂທ: {settings.phone}</p>
              {settings.taxId && <p className="text-[10px] text-slate-500">ເລກປະຈຳຕົວຜູ້ເສຍພາສີ: {settings.taxId}</p>}
            </div>

            {/* Invoice Info */}
            <div className="space-y-1 mb-3 text-[11px] border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span className="text-slate-500">ເລກທີບິນ:</span>
                <span className="font-mono font-semibold">{sale.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ວັນທີ-ເວລາ:</span>
                <span>{new Date(sale.date).toLocaleString('lo-LA')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ປະເພດ:</span>
                <span className="font-medium">{isWholesale ? 'ຂາຍສົ່ງ (Wholesale)' : 'ຂາຍຍ່ອຍ (Retail)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ລູກຄ້າ:</span>
                <span className="font-medium text-slate-900">{sale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ພະນັກງານ:</span>
                <span>{sale.cashierName}</span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left mb-3">
              <thead>
                <tr className="border-b border-slate-400 text-[10px] text-slate-600">
                  <th className="py-1">ລາຍການ</th>
                  <th className="py-1 text-center">ຈຳນວນ</th>
                  <th className="py-1 text-right">ລາຄາ</th>
                  <th className="py-1 text-right">ລວມ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="py-1">
                    <td className="py-1.5 pr-1">
                      <div className="font-medium text-slate-900 leading-tight">{item.productName}</div>
                      <div className="text-[10px] text-slate-500">{item.selectedUnit}</div>
                    </td>
                    <td className="py-1.5 text-center text-slate-700 font-medium">
                      {item.qty}
                    </td>
                    <td className="py-1.5 text-right text-slate-700">
                      {item.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-1.5 text-right font-medium text-slate-900">
                      {item.subtotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px] mb-3">
              <div className="flex justify-between">
                <span className="text-slate-600">ມູນຄ່າລວມ:</span>
                <span>{sale.subtotal.toLocaleString()} ₭</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>ສ່ວນຫຼຸດ:</span>
                  <span>-{sale.discount.toLocaleString()} ₭</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-300">
                <span>ຍອດຊຳລະສຸດທິ:</span>
                <span className="text-emerald-700">{formatMoney(sale.total)}</span>
              </div>

              {/* Payment Details */}
              <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-600 text-[10px]">
                <div className="flex justify-between">
                  <span>ວິທີຊຳລະ:</span>
                  <span className="font-medium text-slate-800">
                    {sale.paymentMethod === 'cash' && 'ເງິນສົດ (Cash)'}
                    {sale.paymentMethod === 'transfer' && 'ໂອນເງິນ (Transfer)'}
                    {sale.paymentMethod === 'credit' && 'ເງິນເຊື່ອ / ຕິດໜີ້ (Credit)'}
                    {sale.paymentMethod === 'split' && 'ຊຳລະຮ່ວມ (ສົດ+ໂອນ)'}
                  </span>
                </div>
                {sale.paymentMethod === 'split' && sale.splitDetails && (
                  <div className="pl-2 space-y-0.5 text-slate-500 text-[10px]">
                    <div className="flex justify-between">
                      <span>• ເງິນສົດ:</span>
                      <span>{sale.splitDetails.cash.toLocaleString()} ₭</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• ໂອນເງິນ:</span>
                      <span>{sale.splitDetails.transfer.toLocaleString()} ₭</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ຮັບເງິນມາ:</span>
                  <span>{sale.amountPaid.toLocaleString()} ₭</span>
                </div>
                {sale.change > 0 && (
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span>ເງິນທອນ:</span>
                    <span>{sale.change.toLocaleString()} ₭</span>
                  </div>
                )}
                {sale.debtAmount > 0 && (
                  <div className="flex justify-between font-bold text-amber-700 bg-amber-50 p-1 rounded-sm mt-1">
                    <span>ຍອດຄ້າງຊຳລະ (ໜີ້):</span>
                    <span>{sale.debtAmount.toLocaleString()} ₭</span>
                  </div>
                )}
              </div>
            </div>

            {/* QR Payment if Transfer */}
            {sale.paymentMethod === 'transfer' && (
              <div className="text-center my-3 p-2 bg-slate-50 rounded-sm border border-slate-200">
                <p className="text-[10px] font-semibold text-slate-700 mb-1">
                  ສະແກນຈ່າຍດ້ວຍ {settings.qrBankName}
                </p>
                <div className="flex justify-center mb-1">
                  <img
                    src={qrUrl}
                    alt="BCEL One QR"
                    className="w-24 h-24 border border-slate-300 rounded-sm p-1 bg-white"
                  />
                </div>
                <p className="text-[9px] text-slate-600 font-mono">{settings.qrAccountNumber}</p>
                <p className="text-[9px] text-slate-500">{settings.qrAccountName}</p>
              </div>
            )}

            {/* Wholesale Signatures if Wholesale */}
            {isWholesale && (
              <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-2 text-center text-[10px] text-slate-600 gap-4">
                <div>
                  <div className="h-8 border-b border-dashed border-slate-400 mb-1"></div>
                  <span>ລາຍເຊັນຜູ້ຮັບເຄື່ອງ</span>
                </div>
                <div>
                  <div className="h-8 border-b border-dashed border-slate-400 mb-1"></div>
                  <span>ລາຍເຊັນຜູ້ສົ່ງເຄື່ອງ</span>
                </div>
              </div>
            )}

            {/* Footer Thank you */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500">
              <p>{settings.receiptFooter}</p>
              <p className="mt-1 font-mono text-[9px] text-slate-400">Powered by LaoPOS Pro</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center no-print">
          <div className="text-xs text-slate-500">
            {sale.status === 'completed' ? (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle className="w-4 h-4" /> ຊຳລະຄົບຖ້ວນ
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <FileText className="w-4 h-4" /> ບິນຄ້າງຊຳລະ
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg cursor-pointer"
            >
              ປິດໜ້າຕ່າງ
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              ສັ່ງພິມໃບບິນ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
