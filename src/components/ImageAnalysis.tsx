import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, Image as ImageIcon, FileText, Check, Plus, AlertCircle, Video } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { db } from '../lib/firebase';
import { collection, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { Account, Category, Transaction, TransactionType } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { motion } from "motion/react";
import { HoverCard, ScrollReveal, StaggerContainer, StaggerItem, TextReveal } from "./MotionWrappers";
import { authFetch } from "../utils/api";

interface ExtractedTransaction {
  date: string;
  amount: number;
  type: TransactionType;
  note: string;
  categoryId?: string;
}

export default function ImageAnalysis() {
  const { user } = useStore();
  const [selectedImages, setSelectedImages] = useState<{ url: string, type: string }[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedTransaction[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    const catUnsub = onSnapshot(collection(db, 'users', user.uid, 'categories'), (snap) => {
      const cats: Category[] = [];
      snap.forEach(doc => cats.push({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
    });
    
    const accUnsub = onSnapshot(collection(db, 'users', user.uid, 'accounts'), (snap) => {
      const accs: Account[] = [];
      snap.forEach(doc => accs.push({ id: doc.id, ...doc.data() } as Account));
      setAccounts(accs);
      if (accs.length > 0) setSelectedAccountId(accs[0].id);
    });

    return () => {
      catUnsub();
      accUnsub();
    };
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const newImages: { url: string, type: string }[] = [];
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} terlalu besar. Maksimal 5MB.`);
        continue;
      }
      
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
           if (file.type.startsWith('image/')) {
               const img = new Image();
               img.onload = () => {
                   const canvas = document.createElement('canvas');
                   const MAX_WIDTH = 1200;
                   const MAX_HEIGHT = 1200;
                   let width = img.width;
                   let height = img.height;

                   if (width > height) {
                       if (width > MAX_WIDTH) {
                           height *= MAX_WIDTH / width;
                           width = MAX_WIDTH;
                       }
                   } else {
                       if (height > MAX_HEIGHT) {
                           width *= MAX_HEIGHT / height;
                           height = MAX_HEIGHT;
                       }
                   }
                   canvas.width = width;
                   canvas.height = height;
                   const ctx = canvas.getContext('2d');
                   ctx?.drawImage(img, 0, 0, width, height);
                   resolve(canvas.toDataURL(file.type, 0.8));
               };
               img.src = e.target?.result as string;
           } else {
               resolve(e.target?.result as string);
           }
        };
        reader.readAsDataURL(file);
      });
      
      newImages.push({ url: dataUrl, type: file.type });
    }

    if (newImages.length > 0) {
      setSelectedImages(prev => [...prev, ...newImages]);
      setExtractedData([]);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (selectedImages.length === 0) return;

    setIsAnalyzing(true);
    setExtractedData([]);

    try {
      const imagesPayload = selectedImages.map(img => {
        const match = img.url.match(/^data:(.*?);base64,(.*)$/);
        if (!match) throw new Error("Format dokumen tidak valid");
        return { mimeType: match[1], data: match[2] };
      });

      const response = await authFetch('/api/gemini/analyze', {
        method: 'POST',
        body: JSON.stringify({
          images: imagesPayload,
          categories: categories.map(c => ({ id: c.id, name: c.name, type: c.type }))
        }),
      });

      if (!response.ok) {
        const errDetails = await response.json().catch(() => ({}));
        console.error("API Error Response:", errDetails);
        throw new Error(errDetails.error || 'Gagal menganalisis dokumen');
      }

      const result = await response.json();
      let parsed = [];
      try {
        parsed = JSON.parse(result.text);
      } catch (e) {
        console.error("Gagal parse JSON dari respons", result.text);
         toast.error("Gagal mendapatkan format data yang tepat dari dokumen");
         setIsAnalyzing(false);
         return;
      }
      
      if (Array.isArray(parsed) && parsed.length > 0) {
         setExtractedData(parsed);
         setSelectedRows(new Set(parsed.map((_, i) => i)));
         toast.success(`Berhasil mengekstrak ${parsed.length} transaksi`);
      } else {
         toast.error("Tidak ditemukan data transaksi pada dokumen ini");
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menganalisis. Coba lagi nanti.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveTransactions = async () => {
     const dataToSave = extractedData.filter((_, i) => selectedRows.has(i));
     if (!user || dataToSave.length === 0 || !selectedAccountId) return;

     setIsSaving(true);
     try {
        const batch = writeBatch(db);
        dataToSave.forEach(item => {
           let dateNum = Date.now();
           if (item.date) {
               const parsedDate = new Date(item.date).getTime();
               if (!isNaN(parsedDate)) dateNum = parsedDate;
           }

           const tsxRef = doc(collection(db, 'users', user.uid, 'transactions'));
           const tsxData: Partial<Transaction> = {
              type: item.type,
              amount: item.amount,
              date: dateNum,
              note: item.note,
           };

           if (item.type === 'income' || item.type === 'expense') {
              tsxData.accountId = selectedAccountId;
              if (item.categoryId) {
                 const cat = categories.find(c => c.id === item.categoryId);
                 if (cat) {
                    tsxData.categoryId = cat.id;
                    tsxData.categoryName = cat.name;
                    tsxData.categoryIcon = cat.icon;
                 }
              }
           } else {
              // Untuk transfer fallback jika ditemukan, kita assign ke selected account aja (ini asumsi sederhana).
              tsxData.fromAccountId = selectedAccountId;
              tsxData.toAccountId = selectedAccountId;
           }
           batch.set(tsxRef, tsxData);
        });

        await batch.commit();
        toast.success(`${dataToSave.length} transaksi berhasil disimpan!`);
        setExtractedData([]);
        setSelectedRows(new Set());
        setSelectedImages([]);
     } catch (err) {
        console.error(err);
        toast.error("Gagal menyimpan transaksi");
     } finally {
        setIsSaving(false);
     }
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-4xl mx-auto p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto bg-app-bg text-app-text">
      <ScrollReveal className="w-full flex flex-col">
        <h1 className="text-2xl font-bold text-app-text-bright mb-6">
          <TextReveal text="Analisis Mutasi Rekening / Struk (AI)" />
        </h1>
        
        <div className="bg-app-card rounded-3xl p-6 border border-app-border shadow-xl">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-app-border rounded-2xl bg-app-bg transition-colors hover:border-app-accent1/50 relative overflow-hidden min-h-[300px]">
                    {selectedImages.length > 0 ? (
                        <div className="w-full flex flex-col items-center gap-4">
                            <div className="flex flex-wrap gap-4 justify-center items-center">
                                {selectedImages.map((img, idx) => (
                                    <div key={idx} className="relative w-32 h-32 md:w-40 md:h-40 flex flex-col items-center justify-center bg-app-card border border-app-border rounded-xl">
                                        {img.type.startsWith('image/') ? (
                                           <img src={img.url} alt="Preview" className="w-full h-full object-cover rounded-xl shadow-md" />
                                        ) : (
                                           <div className="flex flex-col items-center justify-center w-full h-full">
                                              <FileText className="w-8 h-8 text-app-accent1 mb-2" />
                                              <span className="font-semibold text-xs text-center px-2 truncate w-full">Dokumen {idx + 1}</span>
                                           </div>
                                        )}
                                        <button 
                                            onClick={() => {
                                                const newImages = [...selectedImages];
                                                newImages.splice(idx, 1);
                                                setSelectedImages(newImages);
                                                if (newImages.length === 0) setExtractedData([]);
                                            }}
                                            className="absolute -top-2 -right-2 bg-app-danger text-white p-1.5 rounded-full hover:bg-app-danger/80 transition shadow-lg"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-32 h-32 md:w-40 md:h-40 flex flex-col items-center justify-center bg-app-bg border-2 border-dashed border-app-border hover:border-app-accent1/50 rounded-xl transition text-app-text/50 hover:text-app-accent1 group"
                                >
                                    <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-semibold">Tambah File</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <ImageIcon className="w-12 h-12 text-app-text/30 mx-auto mb-4" />
                            <h3 className="text-sm font-semibold text-app-text-bright mb-1">Unggah Struk atau Screenshot Mutasi</h3>
                            <p className="text-xs text-app-text/60 mb-4">PNG, JPG, PDF, up to 5MB. Bisa unggah beberapa file sekaligus.</p>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-app-accent1 hover:bg-app-accent1/90 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition shadow-lg shadow-app-accent1/20 flex items-center gap-2 mx-auto"
                            >
                                <Upload className="w-4 h-4" />
                                Pilih File
                            </button>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/png, image/jpeg, image/webp, application/pdf" 
                        className="hidden" 
                        multiple
                    />
                </div>
            </div>

            {selectedImages.length > 0 && extractedData.length === 0 && (
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing}
                        className="bg-app-accent1 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-app-accent1/90 transition disabled:opacity-50 shadow-lg shadow-app-accent1/20"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Menganalisis Gambar...
                            </>
                        ) : (
                            <>
                                <Camera className="w-5 h-5" />
                                Analisis dengan AI
                            </>
                        )}
                    </button>
                </div>
            )}

            {extractedData.length > 0 && (
                <div className="mt-8 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                        <h3 className="text-lg font-bold text-app-text-bright flex items-center gap-2">
                           <Check className="w-5 h-5 text-app-success" />
                           Berhasil Mengekstrak {extractedData.length} Transaksi
                        </h3>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto bg-app-bg p-2 pl-4 rounded-xl border border-app-border">
                           <span className="text-xs font-semibold text-app-text/70 uppercase tracking-wider">Simpan Ke Rekening:</span>
                           <select 
                              value={selectedAccountId}
                              onChange={(e) => setSelectedAccountId(e.target.value)}
                              className="bg-transparent text-sm font-bold text-app-text-bright focus:outline-none"
                           >
                              {accounts.map(acc => (
                                 <option key={acc.id} value={acc.id}>{acc.name}</option>
                              ))}
                           </select>
                        </div>
                    </div>
                    
                    <div className="bg-app-bg border border-app-border rounded-2xl overflow-hidden mb-6">
                        <div className="overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                              <thead>
                                 <tr className="bg-app-card border-b border-app-border text-xs uppercase tracking-wider text-app-text/70">
                                    <th className="p-4 w-12 text-center">
                                       <input 
                                          type="checkbox" 
                                          checked={selectedRows.size === extractedData.length && extractedData.length > 0}
                                          onChange={(e) => {
                                             if (e.target.checked) {
                                                setSelectedRows(new Set(extractedData.map((_, i) => i)));
                                             } else {
                                                setSelectedRows(new Set());
                                             }
                                          }}
                                          className="w-4 h-4 rounded border-app-border text-app-accent1 focus:ring-app-accent1 cursor-pointer"
                                       />
                                    </th>
                                    <th className="p-4 font-bold">Catatan</th>
                                    <th className="p-4 font-bold">Kategori</th>
                                    <th className="p-4 font-bold text-right">Nominal</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {extractedData.map((trx, idx) => (
                                    <tr key={idx} className="border-b border-app-border/50 last:border-0 hover:bg-app-card/50 transition">
                                       <td className="p-4 text-center">
                                          <input 
                                             type="checkbox" 
                                             checked={selectedRows.has(idx)}
                                             onChange={(e) => {
                                                const newSet = new Set(selectedRows);
                                                if (e.target.checked) newSet.add(idx);
                                                else newSet.delete(idx);
                                                setSelectedRows(newSet);
                                             }}
                                             className="w-4 h-4 rounded border-app-border text-app-accent1 focus:ring-app-accent1 cursor-pointer"
                                          />
                                       </td>
                                       <td className="p-4">
                                          <div className="text-sm font-bold text-app-text-bright">{trx.note || "Tanpa Keterangan"}</div>
                                          <div className="text-xs text-app-text/60 mt-0.5">{new Date(trx.date).toLocaleDateString('id-ID')}</div>
                                       </td>
                                       <td className="p-4">
                                          {trx.categoryId ? (
                                             <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-app-card border border-app-border text-xs font-semibold">
                                                <CategoryIcon iconId={categories.find(c => c.id === trx.categoryId)?.icon || 'dollar-sign'} className={`w-3 h-3 ${trx.type === 'income' ? 'text-app-success' : 'text-app-danger'}`} />
                                                {categories.find(c => c.id === trx.categoryId)?.name || "Kategori"}
                                             </span>
                                          ) : (
                                             <span className="text-xs text-app-text/50 italic flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                Tidak terdeteksi
                                             </span>
                                          )}
                                       </td>
                                       <td className="p-4 text-right">
                                          <span className={`text-sm font-bold whitespace-nowrap ${trx.type === 'income' ? 'text-app-success' : trx.type === 'expense' ? 'text-app-danger' : 'text-app-text'}`}>
                                             {trx.type === 'income' ? '+' : trx.type === 'expense' ? '-' : ''} Rp {trx.amount.toLocaleString('id-ID')}
                                          </span>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                       <button 
                          onClick={handleSaveTransactions}
                          disabled={isSaving || !selectedAccountId || selectedRows.size === 0}
                          className="bg-app-success text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-app-success/90 transition disabled:opacity-50 shadow-xl shadow-app-success/20"
                       >
                          {isSaving ? (
                             <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Menyimpan Data...
                             </>
                          ) : (
                             <>
                                <Plus className="w-5 h-5" />
                                Simpan Transaksi ({selectedRows.size})
                             </>
                          )}
                       </button>
                    </div>
                </div>
            )}
        </div>
      </ScrollReveal>
    </div>
  );
}

