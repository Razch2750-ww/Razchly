import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Category } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { CategoryIcon, CATEGORY_ICONS } from './CategoryIcon';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  type: 'income' | 'expense';
}

export function CategoryModal({ isOpen, onClose, category, type }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('dollar-sign');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon || (type === 'income' ? 'trending-up' : 'trending-down'));
    } else {
      setName('');
      setIcon(type === 'income' ? 'trending-up' : 'trending-down');
    }
  }, [category, isOpen, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const categoriesRef = collection(db, 'users', auth.currentUser.uid, 'categories');
      
      if (category) {
        await updateDoc(doc(categoriesRef, category.id), {
          name,
          icon
        });
      } else {
        await addDoc(categoriesRef, {
          name,
          icon,
          type,
          createdAt: Date.now()
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-app-card w-full max-w-md rounded-[24px] p-6 relative border border-app-border/40 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-app-text hover:text-app-text-bright transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-app-text-bright mb-6">
          {category ? 'Edit Kategori' : `Tambah Kategori ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="floating-label-group">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="floating-label-input"
              placeholder="Contoh: Makanan"
              id="cat-name"
              required
              autoFocus
            />
            <label htmlFor="cat-name" className="floating-label-text">Nama Kategori</label>
          </div>

          <div>
            <label className="text-sm font-semibold text-app-text-bright mb-3 block">
              Pilih Ikon
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 max-h-[200px] overflow-y-auto no-scrollbar p-1">
              {CATEGORY_ICONS.map((iconItem) => (
                <button
                  key={iconItem.id}
                  type="button"
                  onClick={() => setIcon(iconItem.id)}
                  title={iconItem.name}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                    icon === iconItem.id
                      ? 'bg-app-accent1 text-white shadow-md'
                      : 'bg-app-bg text-app-text hover:bg-app-hover border border-app-border'
                  }`}
                >
                  <CategoryIcon iconId={iconItem.id} className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full bg-app-accent1 hover:bg-app-accent1/90 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
