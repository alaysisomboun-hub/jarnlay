import React, { useState, useRef } from 'react';
import { usePos } from '../context/PosContext';
import {
  Settings,
  Store,
  DollarSign,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  X,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToDefaults,
  } = usePos();

  const [formData, setFormData] = useState(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    alert('ບັນທຶກການຕັ້ງຄ່າຮ້ານຄ້າ ແລະ ອັດຕາແລກປ່ຽນສຳເລັດ!');
    onClose();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJSON(content);
      if (success) {
        alert('ກູ້ຄືນຂໍ້ມູນສຳຮອງສຳເລັດແລ້ວ! ລະບົບໄດ້ໂຫຼດຂໍ້ມູນຄືນໃໝ່');
        onClose();
      } else {
        alert('ໄຟລ໌ສຳຮອງບໍ່ຖືກຕ້ອງ ຫຼື ເສຍຫາຍ');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetConfirm = () => {
    if (
      window.confirm(
        'ຄຳເຕືອນ: ທ່ານຕ້ອງການຣີເຊັດລະບົບກັບໄປເປັນຂໍ້ມູນເລີ່ມຕົ້ນແທ້ຫຼືບໍ່? (ຂໍ້ມູນທີ່ບັນທຶກໃໝ່ຈະຖືກລຶບທັງໝົດ)'
      )
    ) {
      resetToDefaults();
      alert('ຣີເຊັດລະບົບສຳເລັດ!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">ຕັ້ງຄ່າລະບົບຮ້ານຄ້າ & ສຳຮອງຂໍ້ມູນ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Store Info Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1">
              <Store className="w-4 h-4 text-indigo-600" />
              ຂໍ້ມູນຮ້ານຄ້າ & ໃບບິນ
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ຊື່ຮ້ານຄ້າ (Store Name) *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ສາຂາ</label>
                <input
                  type="text"
                  value={formData.storeBranch}
                  onChange={(e) => setFormData({ ...formData, storeBranch: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ເບີໂທລະສັບ</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ທີ່ຢູ່</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ເລກປະຈຳຕົວຜູ້ເສຍພາສີ</label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ຂໍ້ຄວາມທ້າຍໃບບິນ</label>
                <input
                  type="text"
                  value={formData.receiptFooter}
                  onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Exchange Rates Section */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              ອັດຕາແລກປ່ຽນເງິນຕາຕ່າງປະເທດ (ທຽບເທົ່າ 1 KIP)
            </h4>
            <p className="text-[11px] text-slate-500">
              ໃຊ້ສຳລັບການປຽບທຽບມູນຄ່າເປັນ THB, USD ແລະ VND ໃນໜ້າຈໍ
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">1 THB = (LAK)</label>
                <input
                  type="number"
                  value={formData.exchangeRates.THB}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exchangeRates: {
                        ...formData.exchangeRates,
                        THB: Number(e.target.value) || 685,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-right"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">1 USD = (LAK)</label>
                <input
                  type="number"
                  value={formData.exchangeRates.USD}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exchangeRates: {
                        ...formData.exchangeRates,
                        USD: Number(e.target.value) || 22150,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-right"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">1 VND = (LAK)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.exchangeRates.VND}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exchangeRates: {
                        ...formData.exchangeRates,
                        VND: Number(e.target.value) || 0.88,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-right"
                />
              </div>
            </div>
          </div>

          {/* BCEL One / Bank QR Info */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1">
              <CreditCard className="w-4 h-4 text-blue-600" />
              ບັນຊີຮັບເງິນໂອນ / QR Code
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ຊື່ບັນຊີ</label>
                <input
                  type="text"
                  value={formData.qrAccountName}
                  onChange={(e) => setFormData({ ...formData, qrAccountName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ເລກບັນຊີ (BCEL One)</label>
                <input
                  type="text"
                  value={formData.qrAccountNumber}
                  onChange={(e) => setFormData({ ...formData, qrAccountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Database Backup & Restore */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1">
              <Download className="w-4 h-4 text-purple-600" />
              ສຳຮອງ & ກູ້ຄືນຖານຂໍ້ມູນ (Database Backup & Restore)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={exportDatabaseJSON}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                <span>ດາວໂຫຼດ Backup</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>ກູ້ຄືນ Backup</span>
              </button>

              <button
                type="button"
                onClick={handleResetConfirm}
                className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                <span>ຣີເຊັດເປັນເລີ່ມຕົ້ນ</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              ບັນທຶກການຕັ້ງຄ່າ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
