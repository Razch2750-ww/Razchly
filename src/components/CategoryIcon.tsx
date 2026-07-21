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
  Dumbbell,
  Coffee,
  Shirt,
  Baby,
  Book,
  GraduationCap,
  Smartphone,
  PenTool,
  Camera,
  Gamepad2,
  Ticket,
  Sofa,
  Pill,
  Flower2,
  Cat,
  Dog,
  Carrot
} from 'lucide-react';

export const CATEGORY_ICONS = [
  { id: 'utensils', name: 'Makanan / Minuman', icon: Utensils },
  { id: 'coffee', name: 'Kopi / Minuman', icon: Coffee },
  { id: 'carrot', name: 'Bahan Makanan', icon: Carrot },
  { id: 'car', name: 'Transportasi', icon: Car },
  { id: 'bus', name: 'Bus', icon: Bus },
  { id: 'train', name: 'Kereta', icon: Train },
  { id: 'plane', name: 'Pesawat', icon: Plane },
  { id: 'home', name: 'Rumah', icon: Home },
  { id: 'sofa', name: 'Perabotan', icon: Sofa },
  { id: 'shopping-bag', name: 'Belanja', icon: ShoppingBag },
  { id: 'shirt', name: 'Pakaian / Baju', icon: Shirt },
  { id: 'zap', name: 'Listrik / Utilitas', icon: Zap },
  { id: 'wifi', name: 'Internet', icon: Wifi },
  { id: 'trending-down', name: 'Pengeluaran', icon: TrendingDown },
  { id: 'popcorn', name: 'Hiburan', icon: Popcorn },
  { id: 'music', name: 'Musik', icon: Music },
  { id: 'gamepad2', name: 'Mainan / Game', icon: Gamepad2 },
  { id: 'ticket', name: 'Tiket', icon: Ticket },
  { id: 'gift', name: 'Hadiah', icon: Gift },
  { id: 'plus', name: 'Tambahan', icon: Plus },
  { id: 'briefcase', name: 'Pekerjaan', icon: Briefcase },
  { id: 'book', name: 'Buku', icon: Book },
  { id: 'graduation-cap', name: 'Pendidikan', icon: GraduationCap },
  { id: 'trending-up', name: 'Investasi / Profit', icon: TrendingUp },
  { id: 'dollar-sign', name: 'Gaji', icon: DollarSign },
  { id: 'heart', name: 'Amal', icon: Heart },
  { id: 'heart-pulse', name: 'Kesehatan', icon: HeartPulse },
  { id: 'pill', name: 'Obat', icon: Pill },
  { id: 'dumbbell', name: 'Olahraga', icon: Dumbbell },
  { id: 'monitor', name: 'Elektronik / Komputer', icon: Monitor },
  { id: 'smartphone', name: 'Handphone', icon: Smartphone },
  { id: 'camera', name: 'Kamera / Foto', icon: Camera },
  { id: 'credit-card', name: 'Cicilan / Utang', icon: CreditCard },
  { id: 'baby', name: 'Anak / Bayi', icon: Baby },
  { id: 'cat', name: 'Kucing / Hewan', icon: Cat },
  { id: 'dog', name: 'Anjing', icon: Dog },
  { id: 'flower2', name: 'Tanaman / Hobi', icon: Flower2 },
  { id: 'pen-tool', name: 'Desain / Tool', icon: PenTool },
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
