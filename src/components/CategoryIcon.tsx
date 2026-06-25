import React from 'react';
import {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Zap,
  TrendingDown,
  Popcorn,
  Gift,
  Plus,
  Briefcase,
  TrendingUp,
  DollarSign,
  Heart,
  Monitor,
  Music,
  CreditCard,
  Wifi,
  Bus,
  Train,
  Plane,
  HeartPulse,
  Dumbbell
} from 'lucide-react';

export const CATEGORY_ICONS = [
  { id: 'utensils', name: 'Makanan / Minuman', icon: Utensils },
  { id: 'car', name: 'Transportasi', icon: Car },
  { id: 'bus', name: 'Bus', icon: Bus },
  { id: 'train', name: 'Kereta', icon: Train },
  { id: 'plane', name: 'Pesawat', icon: Plane },
  { id: 'home', name: 'Rumah', icon: Home },
  { id: 'shopping-bag', name: 'Belanja', icon: ShoppingBag },
  { id: 'zap', name: 'Listrik / Utilitas', icon: Zap },
  { id: 'wifi', name: 'Internet', icon: Wifi },
  { id: 'trending-down', name: 'Pengeluaran', icon: TrendingDown },
  { id: 'popcorn', name: 'Hiburan', icon: Popcorn },
  { id: 'music', name: 'Musik', icon: Music },
  { id: 'gift', name: 'Hadiah', icon: Gift },
  { id: 'plus', name: 'Tambahan', icon: Plus },
  { id: 'briefcase', name: 'Pekerjaan', icon: Briefcase },
  { id: 'trending-up', name: 'Investasi / Profit', icon: TrendingUp },
  { id: 'dollar-sign', name: 'Gaji', icon: DollarSign },
  { id: 'heart', name: 'Amal', icon: Heart },
  { id: 'heart-pulse', name: 'Kesehatan', icon: HeartPulse },
  { id: 'dumbbell', name: 'Olahraga', icon: Dumbbell },
  { id: 'monitor', name: 'Elektronik / Gadget', icon: Monitor },
  { id: 'credit-card', name: 'Cicilan / Utang', icon: CreditCard },
];

export const getCategoryIconDetails = (iconId?: string) => {
  if (!iconId) return { icon: DollarSign, name: 'Default', id: 'dollar-sign' };
  
  const found = CATEGORY_ICONS.find(icon => icon.id === iconId);
  return found || { icon: DollarSign, name: 'Default', id: 'dollar-sign' };
};

export const CategoryIcon = ({ iconId, className }: { iconId?: string, className?: string }) => {
  const iconInfo = getCategoryIconDetails(iconId);
  const IconComponent = iconInfo.icon;
  
  return <IconComponent className={className} />;
};
