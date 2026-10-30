import React, { useState, useMemo, useRef } from 'react';
import { usePos } from '../context/PosContext';
import { Product, UnitConversion, VolumePriceTier } from '../types';
import { BarcodeCameraScanner } from './BarcodeCameraScanner';
import { getCategoryMeta, PRESET_CATEGORY_OPTIONS } from '../lib/categories';
import {
  Package,
  Plus,
  Search,
  Camera,
  Edit,
  Trash2,
  Download,
  Upload,
  Layers,
  Tag,
  Barcode,
  X,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  UploadCloud,
  Link as LinkIcon,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const PRESET_PRODUCT_IMAGES = [
  {
    name: 'ເບຍລາວ',
    url: 'https://images.unsplash.com/photo-1608270104675-90d565673d32?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'ນ້ຳດື່ມຫົວເສືອ',
    url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'ກາເຟດາວ',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'ເຂົ້າສານໜຽວ',
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'ໝີ່ໄວໆ/ມາມ່າ',
    url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'ນ້ຳມັນພືດ',
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'ນ້ຳອັດລົມ',
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'ຂະໜົມຂົບຄ້ຽວ',
    url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'ເຄື່ອງໃຊ້/ຝຸ່ນຊັກ',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'ຊູກຳລັງ',
    url: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=400&q=80',
  },
];

export const ProductManagement: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, formatMoney } = usePos();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'search' | 'form'>('search');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const cameraPhotoInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const initialFormState: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
    code: '',
    barcode: '',
    name: '',
    category: 'ທົ່ວໄປ',
    imageUrl: '',
    baseUnit: 'ອັນ',
    costPrice: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    wholesaleMinQty: 1,
    stockQty: 20, // Default to 20 so new products can immediately be sold in POS without being blocked
    minStockAlert: 5,
    units: [{ name: 'ອັນ', factor: 1, retailPrice: 0, wholesalePrice: 0, isBase: true }],
    volumePrices: [],
  };

  const [formData, setFormData] = useState(initialFormState);

  // Filter Categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.includes(q);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingProductId(null);
    const randomCode = `PROD-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomBarcode = `885${Date.now().toString().slice(-10)}`;
    setFormData({
      ...initialFormState,
      code: randomCode,
      barcode: randomBarcode,
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (p: Product) => {
    setEditingProductId(p.id);
    setFormData({
      code: p.code,
      barcode: p.barcode,
      name: p.name,
      category: p.category,
      imageUrl: p.imageUrl || '',
      baseUnit: p.baseUnit,
      costPrice: p.costPrice,
      retailPrice: p.retailPrice,
      wholesalePrice: p.wholesalePrice,
      wholesaleMinQty: p.wholesaleMinQty,
      stockQty: p.stockQty,
      minStockAlert: p.minStockAlert,
      units: p.units && p.units.length > 0 ? p.units : [{ name: p.baseUnit, factor: 1, retailPrice: p.retailPrice, wholesalePrice: p.wholesalePrice, isBase: true }],
      volumePrices: p.volumePrices || [],
    });
    setIsModalOpen(true);
  };

  // Unit manipulation in form
  const addUnitConversion = () => {
    const newUnit: UnitConversion = {
      name: 'ແພັກ',
      factor: 12,
      retailPrice: formData.retailPrice * 12,
      wholesalePrice: formData.wholesalePrice * 12,
      barcode: '',
      isBase: false,
    };
    setFormData({ ...formData, units: [...formData.units, newUnit] });
  };

  const updateUnit = (index: number, updates: Partial<UnitConversion>) => {
    const updated = [...formData.units];
    updated[index] = { ...updated[index], ...updates };
    setFormData({ ...formData, units: updated });
  };

  const removeUnit = (index: number) => {
    if (formData.units[index].isBase) {
      alert('ບໍ່ສາມາດລຶບໜ່ວຍນັບຫຼັກໄດ້!');
      return;
    }
    setFormData({ ...formData, units: formData.units.filter((_, i) => i !== index) });
  };

  // Volume price tiers manipulation
  const addVolumeTier = () => {
    const newTier: VolumePriceTier = {
      minQty: 10,
      unitPrice: Math.round(formData.retailPrice * 0.9),
      label: 'ຊື້ 10 ຂຶ້ນໄປ',
    };
    setFormData({ ...formData, volumePrices: [...(formData.volumePrices || []), newTier] });
  };

  const updateVolumeTier = (index: number, updates: Partial<VolumePriceTier>) => {
    const tiers = [...(formData.volumePrices || [])];
    tiers[index] = { ...tiers[index], ...updates };
    setFormData({ ...formData, volumePrices: tiers });
  };

  const removeVolumeTier = (index: number) => {
    setFormData({
      ...formData,
      volumePrices: (formData.volumePrices || []).filter((_, i) => i !== index),
    });
  };

  // Handle image upload from file or camera with safe compression
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('ກະລຸນາເລືອກໄຟລ໌ຮູບພາບ (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result as string;
      // Aggressive compression for mobile: 320px square thumbnail @ 0.65 quality produces tiny ~15KB data URLs
      const img = new window.Image();
      img.src = rawData;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.65);
          setFormData((prev) => ({ ...prev, imageUrl: compressed }));
        } else {
          setFormData((prev) => ({ ...prev, imageUrl: rawData }));
        }
      };
      img.onerror = () => {
        setFormData((prev) => ({ ...prev, imageUrl: rawData }));
      };
    };
    reader.readAsDataURL(file);

    // Reset so same file can be selected again
    e.target.value = '';
  };

  // Save product with feedback and guaranteed storage write
  const handleSaveProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      alert('ກະລຸນາປ້ອນຊື່ສິນຄ້າ ແລະ ລະຫັດສິນຄ້າ!');
      return;
    }

    try {
      const savedName = formData.name.trim();
      if (editingProductId) {
        updateProduct(editingProductId, formData);
        setSuccessToast(`✓ ແກ້ໄຂສິນຄ້າ "${savedName}" ສຳເລັດແລ້ວ!`);
      } else {
        addProduct(formData);
        setSuccessToast(`✓ ເພີ່ມສິນຄ້າ "${savedName}" ເຂົ້າລະບົບສຳເລັດແລ້ວ!`);
      }

      // Haptic feedback
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        navigator.vibrate([40, 40, 40]);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ: ' + (err.message || 'ກະລຸນາລອງໃໝ່'));
    }
  };

  // Delete product
  const handleDeleteProduct = (p: Product) => {
    if (window.confirm(`ທ່ານຕ້ອງການລຶບສິນຄ້າ "${p.name}" ແທ້ຫຼືບໍ່?`)) {
      deleteProduct(p.id);
    }
  };

  // Export to Excel/CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'ລະຫັດສິນຄ້າ',
      'ບາໂຄດ',
      'ຊື່ສິນຄ້າ',
      'ໝວດໝູ່',
      'ໜ່ວຍນັບຫຼັກ',
      'ຕົ້ນທຶນ (LAK)',
      'ລາຄາຂາຍຍ່ອຍ (LAK)',
      'ລາຄາຂາຍສົ່ງ (LAK)',
      'ຂັ້ນຕ່ຳຂາຍສົ່ງ',
      'ສະຕັອກຄົງເຫຼືອ',
      'ເຕືອນສະຕັອກຕ່ຳ',
      'ໜ່ວຍນັບອື່ນໆ',
    ];

    const rows = products.map((p) => [
      `"${p.code}"`,
      `"${p.barcode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.baseUnit}"`,
      p.costPrice,
      p.retailPrice,
      p.wholesalePrice,
      p.wholesaleMinQty,
      p.stockQty,
      p.minStockAlert,
      `"${p.units.map((u) => `${u.name} (x${u.factor})`).join('; ')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laopos-products-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import from CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          alert('ໄຟລ໌ CSV ບໍ່ມີຂໍ້ມູນ');
          return;
        }

        let importedCount = 0;
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 7) {
            const code = cols[0] || `PROD-${Date.now()}-${i}`;
            const barcode = cols[1] || `${Date.now()}${i}`;
            const name = cols[2];
            const category = cols[3] || 'ທົ່ວໄປ';
            const baseUnit = cols[4] || 'ອັນ';
            const costPrice = Number(cols[5]) || 0;
            const retailPrice = Number(cols[6]) || 0;
            const wholesalePrice = Number(cols[7]) || retailPrice * 0.9;
            const wholesaleMinQty = Number(cols[8]) || 1;
            const stockQty = Number(cols[9]) || 0;
            const minStockAlert = Number(cols[10]) || 5;

            if (name) {
              addProduct({
                code,
                barcode,
                name,
                category,
                baseUnit,
                costPrice,
                retailPrice,
                wholesalePrice,
                wholesaleMinQty,
                stockQty,
                minStockAlert,
                units: [
                  { name: baseUnit, factor: 1, retailPrice, wholesalePrice, isBase: true },
                ],
              });
              importedCount++;
            }
          }
        }
        alert(`ນຳເຂົ້າສິນຄ້າສຳເລັດ ${importedCount} ລາຍການ!`);
      } catch (err) {
        alert('ເກີດຂໍ້ຜິດພາດໃນການອ່ານໄຟລ໌ CSV');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold mb-1">
            <Package className="w-4 h-4" />
            <span>ຈັດການລາຍການສິນຄ້າ ແລະ ໜ່ວຍນັບ</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ລາຍການສິນຄ້າທັງໝົດ ({products.length} ລາຍການ)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ກຳນົດລາຄາຂາຍຍ່ອຍ, ລາຄາຂາຍສົ່ງ, ລາຄາຕາມຈຳນວນ ແລະ ການແປງໜ່ວຍນັບ (ອັນ, ແພັກ, ລັງ, ກ່ອງ)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Import Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>ນຳເຂົ້າ Excel/CSV</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ສົ່ງອອກ Excel</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ເພີ່ມສິນຄ້າໃໝ່</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-96">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ, ລະຫັດ ຫຼື ບາໂຄດ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setCameraTarget('search');
              setIsCameraOpen(true);
            }}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            title="ສະແກນບາໂຄດເພື່ອຄົ້ນຫາ"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ກ້ອງສະແກນ</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
          {categories.map((cat) => {
            const count =
              cat === 'all'
                ? products.length
                : products.filter((p) => p.category === cat).length;
            const meta = getCategoryMeta(cat);
            const Icon = meta.icon;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? meta.activeBgColor + ' border-transparent'
                    : `${meta.bgColor} ${meta.borderColor} ${meta.color}`
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : meta.color}`} />
                <span>{cat === 'all' ? 'ທຸກໝວດໝູ່' : cat}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : `${meta.badgeBg} ${meta.badgeText}`
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">ສິນຄ້າ</th>
                <th className="px-4 py-3 font-semibold">ໝວດໝູ່</th>
                <th className="px-4 py-3 font-semibold">ໜ່ວຍນັບ</th>
                <th className="px-4 py-3 font-semibold text-right">ຕົ້ນທຶນ</th>
                <th className="px-4 py-3 font-semibold text-right">ຂາຍຍ່ອຍ</th>
                <th className="px-4 py-3 font-semibold text-right">ຂາຍສົ່ງ</th>
                <th className="px-4 py-3 font-semibold text-center">ສະຕັອກ</th>
                <th className="px-4 py-3 font-semibold text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    ບໍ່ພົບສິນຄ້າທີ່ກົງກັບເງື່ອນໄຂ
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stockQty <= 0;
                  const isLow = p.stockQty > 0 && p.stockQty <= p.minStockAlert;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Name & Barcode */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {p.code} | {p.barcode}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {(() => {
                          const catMeta = getCategoryMeta(p.category);
                          const CatIcon = catMeta.icon;
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${catMeta.bgColor} ${catMeta.borderColor} ${catMeta.color}`}
                            >
                              <CatIcon className="w-3 h-3" />
                              <span>{p.category}</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Units */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {p.units.map((u, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              {u.name} (x{u.factor})
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {formatMoney(p.costPrice)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {formatMoney(p.retailPrice)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                        {formatMoney(p.wholesalePrice)}
                      </td>

                      {/* Stock Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isOutOfStock
                              ? 'bg-red-50 text-red-700'
                              : isLow
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {p.stockQty} {p.baseUnit}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                            title="ແກ້ໄຂ"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="ລຶບ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-xs sm:text-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-5 h-5 text-white shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex sm:items-center sm:justify-center p-0 sm:p-4 overflow-hidden">
          <div className="bg-white sm:rounded-2xl rounded-none shadow-2xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[92vh] overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  {editingProductId ? 'ແກ້ໄຂຂໍ້ມູນສິນຄ້າ' : 'ເພີ່ມສິນຄ້າໃໝ່'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile Quick Save Button */}
                <button
                  type="button"
                  onClick={() => handleSaveProduct()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>ບັນທຶກ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Row 1: Code, Barcode, Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ລະຫັດສິນຄ້າ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      ລະຫັດບາໂຄດ
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraTarget('form');
                        setIsCameraOpen(true);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      <span>ສ່ອງກ້ອງ</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ໝວດໝູ່ຜະລິດຕະພັນ *
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {PRESET_CATEGORY_OPTIONS.filter((c) => c !== 'ອື່ນໆ').map((preset) => {
                      const meta = getCategoryMeta(preset);
                      const Icon = meta.icon;
                      const isChosen = formData.category === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: preset })}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer border ${
                            isChosen
                              ? meta.activeBgColor + ' border-transparent'
                              : `${meta.bgColor} ${meta.borderColor} ${meta.color}`
                          }`}
                        >
                          <Icon className={`w-3 h-3 ${isChosen ? 'text-white' : meta.color}`} />
                          <span>{preset}</span>
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="ຫຼື ພິມໝວດໝູ່ກຳນົດເອງ..."
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຊື່ສິນຄ້າ (Lao Name) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ເຊັ່ນ: ເບຍລາວ ຂວດໃຫຍ່ 640ml"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              {/* Product Image Section */}
              <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>ຮູບພາບສິນຄ້າ (Product Image)</span>
                  </label>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ລຶບຮູບ</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Image Preview Box */}
                  <div className="w-full sm:w-36 h-36 rounded-xl bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden shrink-0 relative group shadow-xs">
                    {formData.imageUrl ? (
                      <>
                        <img
                          src={formData.imageUrl}
                          alt="Product Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => imageFileInputRef.current?.click()}
                            className="p-1.5 bg-white text-slate-800 rounded-lg text-xs font-medium hover:bg-slate-100 cursor-pointer shadow-sm"
                            title="ປ່ຽນຮູບ"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="p-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 cursor-pointer shadow-sm"
                            title="ລຶບຮູບ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                          ມີຮູບແລ້ວ
                        </span>
                      </>
                    ) : (
                      <div
                        onClick={() => imageFileInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-emerald-50/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-1 text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700 leading-tight">
                          ອັບໂຫຼດຮູບພາບ
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          ຄລິກເລືອກໄຟລ໌
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Upload / Preset Controls */}
                  <div className="flex-1 space-y-3 w-full">
                    {/* Hidden file inputs */}
                    <input
                      ref={imageFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />
                    <input
                      ref={cameraPhotoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => imageFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>ເລືອກຮູບຈາກເຄື່ອງ (Upload)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraPhotoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>ຖ່າຍຮູບດ້ວຍກ້ອງ</span>
                      </button>
                    </div>

                    {/* Direct Image URL input */}
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="url"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          placeholder="ຫຼື ວາງລິ້ງຮູບພາບ (Image URL ເຊັ່ນ: https://...)"
                          className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Preset sample images */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>ເລືອກຮູບຕົວຢ່າງດ່ວນ (Quick Presets):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_PRODUCT_IMAGES.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 transition-all cursor-pointer ${
                              formData.imageUrl === preset.url
                                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                            }`}
                          >
                            <span>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Base Unit field */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ໜ່ວຍນັບຫຼັກ (Base Unit) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.baseUnit}
                    onChange={(e) => {
                      const base = e.target.value;
                      setFormData({
                        ...formData,
                        baseUnit: base,
                        units: formData.units.map((u) => (u.isBase ? { ...u, name: base } : u)),
                      });
                    }}
                    placeholder="ເຊັ່ນ: ອັນ, ຂວດ, ຕຸກ, ຖົງ, ກິໂລ"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ສະຖານະຮູບພາບ
                  </label>
                  <div className="h-[38px] px-3 flex items-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
                    {formData.imageUrl ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ມີຮູບພາບພ້ອມສະແດງໃນລະບົບ POS
                      </span>
                    ) : (
                      <span className="text-slate-400">ບໍ່ທັນໃສ່ຮູບພາບ (ຈະໃຊ້ໄອຄອນໝວດໝູ່ແທນ)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Grid (Cost, Retail, Wholesale, Wholesale Min) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ຕົ້ນທຶນ/ໜ່ວຍຫຼັກ (KIP)
                  </label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-bold px-2.5 py-1.5 border border-slate-300 rounded-lg text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-700 mb-1">
                    ຂາຍຍ່ອຍ/ໜ່ວຍຫຼັກ (KIP)
                  </label>
                  <input
                    type="number"
                    value={formData.retailPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        retailPrice: val,
                        units: formData.units.map((u) => (u.isBase ? { ...u, retailPrice: val } : u)),
                      });
                    }}
                    className="w-full text-xs font-bold text-emerald-800 px-2.5 py-1.5 border border-emerald-300 rounded-lg text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-700 mb-1">
                    ຂາຍສົ່ງ/ໜ່ວຍຫຼັກ (KIP)
                  </label>
                  <input
                    type="number"
                    value={formData.wholesalePrice}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        wholesalePrice: val,
                        units: formData.units.map((u) => (u.isBase ? { ...u, wholesalePrice: val } : u)),
                      });
                    }}
                    className="w-full text-xs font-bold text-indigo-800 px-2.5 py-1.5 border border-indigo-300 rounded-lg text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ຂັ້ນຕ່ຳໄດ້ລາຄາສົ່ງ
                  </label>
                  <input
                    type="number"
                    value={formData.wholesaleMinQty}
                    onChange={(e) => setFormData({ ...formData, wholesaleMinQty: Number(e.target.value) || 1 })}
                    className="w-full text-xs font-bold px-2.5 py-1.5 border border-slate-300 rounded-lg text-right font-mono"
                  />
                </div>
              </div>

              {/* Stock and Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ຈຳນວນສະຕັອກປັດຈຸບັນ ({formData.baseUnit})
                  </label>
                  <input
                    type="number"
                    value={formData.stockQty}
                    onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ຈຳນວນເຕືອນສະຕັອກໃກ້ໝົດ
                  </label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg text-right font-mono"
                  />
                </div>
              </div>

              {/* Multi-unit Packaging Builder (1 ລັງ = 12 ອັນ, etc.) */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      ຮອງຮັບຫຼາຍໜ່ວຍນັບ (ແພັກ, ລັງ, ກ່ອງ, ກະສອບ)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      ກຳນົດອັດຕາການແປງໜ່ວຍນັບ ເຊັ່ນ 1 ລັງ = 12 {formData.baseUnit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addUnitConversion}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ເພີ່ມໜ່ວຍນັບ
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.units.map((unit, uIdx) => (
                    <div
                      key={uIdx}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                    >
                      <div className="w-28">
                        <span className="text-[9px] text-slate-400 block">ຊື່ໜ່ວຍນັບ</span>
                        <input
                          type="text"
                          value={unit.name}
                          disabled={unit.isBase}
                          onChange={(e) => updateUnit(uIdx, { name: e.target.value })}
                          className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded font-medium"
                        />
                      </div>

                      <div className="w-20">
                        <span className="text-[9px] text-slate-400 block">ອັດຕາແປງ (x)</span>
                        <input
                          type="number"
                          value={unit.factor}
                          disabled={unit.isBase}
                          onChange={(e) => {
                            const factor = Number(e.target.value) || 1;
                            updateUnit(uIdx, {
                              factor,
                              retailPrice: formData.retailPrice * factor,
                              wholesalePrice: formData.wholesalePrice * factor,
                            });
                          }}
                          className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-center font-mono"
                        />
                      </div>

                      <div className="flex-1">
                        <span className="text-[9px] text-slate-400 block">ລາຄາຂາຍຍ່ອຍ</span>
                        <input
                          type="number"
                          value={unit.retailPrice}
                          onChange={(e) => updateUnit(uIdx, { retailPrice: Number(e.target.value) || 0 })}
                          className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-right font-mono"
                        />
                      </div>

                      <div className="flex-1">
                        <span className="text-[9px] text-slate-400 block">ລາຄາຂາຍສົ່ງ</span>
                        <input
                          type="number"
                          value={unit.wholesalePrice}
                          onChange={(e) => updateUnit(uIdx, { wholesalePrice: Number(e.target.value) || 0 })}
                          className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-right font-mono"
                        />
                      </div>

                      {!unit.isBase && (
                        <button
                          type="button"
                          onClick={() => removeUnit(uIdx)}
                          className="p-1 text-slate-400 hover:text-red-600 mt-3 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Volume Price Tiers */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      ກຳນົດລາຄາຕາມຈຳນວນທີ່ຊື້ (Volume Pricing)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      ຫຼຸດລາຄາອັດຕະໂນມັດເມື່ອຊື້ຮອດຈຳນວນທີ່ກຳນົດ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVolumeTier}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ເພີ່ມຂັ້ນລາຄາ
                  </button>
                </div>

                <div className="space-y-2">
                  {(formData.volumePrices || []).length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-1">ຍັງບໍ່ມີການຕັ້ງລາຄາຕາມຈຳນວນ</p>
                  ) : (
                    formData.volumePrices?.map((tier, tIdx) => (
                      <div
                        key={tIdx}
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                      >
                        <div className="w-32">
                          <span className="text-[9px] text-slate-400 block">ຊື້ຂັ້ນຕ່ຳ ({formData.baseUnit})</span>
                          <input
                            type="number"
                            value={tier.minQty}
                            onChange={(e) => updateVolumeTier(tIdx, { minQty: Number(e.target.value) || 0 })}
                            className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-center font-mono"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-[9px] text-slate-400 block">ລາຄາຕໍ່ໜ່ວຍ (KIP)</span>
                          <input
                            type="number"
                            value={tier.unitPrice}
                            onChange={(e) => updateVolumeTier(tIdx, { unitPrice: Number(e.target.value) || 0 })}
                            className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-right font-mono"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-[9px] text-slate-400 block">ຄຳອະທິບາຍ</span>
                          <input
                            type="text"
                            value={tier.label || ''}
                            placeholder="ເຊັ່ນ: 10 ຂວດຂຶ້ນໄປ"
                            onChange={(e) => updateVolumeTier(tIdx, { label: e.target.value })}
                            className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVolumeTier(tIdx)}
                          className="p-1 text-slate-400 hover:text-red-600 mt-3 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </form>

            {/* Sticky Bottom Action Bar for Mobile & Desktop */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-white/95 backdrop-blur-sm shrink-0 flex items-center justify-between gap-3 shadow-lg z-10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                onClick={() => handleSaveProduct()}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                <span>ບັນທຶກສິນຄ້າເຂົ້າລະບົບ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Camera Scanner Modal */}
      <BarcodeCameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={(scannedCode) => {
          if (cameraTarget === 'search') {
            setSearchQuery(scannedCode);
          } else {
            setFormData((prev) => ({ ...prev, barcode: scannedCode }));
          }
          setIsCameraOpen(false);
        }}
        title={
          cameraTarget === 'search'
            ? 'ສະແກນບາໂຄດເພື່ອຄົ້ນຫາສິນຄ້າ'
            : 'ສະແກນບາໂຄດໃສ່ຟອມສິນຄ້າ'
        }
        sampleBarcodes={products.slice(0, 6).map((p) => ({ code: p.barcode, name: p.name }))}
      />
    </div>
  );
};
