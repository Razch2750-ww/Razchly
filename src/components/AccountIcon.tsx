import React from 'react';
import { Wallet, Smartphone, Banknote } from 'lucide-react';

export const ACCOUNT_ICONS = [
  { id: 'wallet', name: 'Dompet Default', type: 'generic' },
  { id: 'cash', name: 'Cash Tunai', type: 'cash' },
  { id: 'bca', name: 'BCA', type: 'bank', color: '#0066AE' },
  { id: 'bni', name: 'BNI', type: 'bank', color: '#005E6A' },
  { id: 'bri', name: 'BRI', type: 'bank', color: '#00529C' },
  { id: 'mandiri', name: 'Mandiri', type: 'bank', color: '#0B3A82' },
  { id: 'bsi', name: 'BSI', type: 'bank', color: '#00A39D' },
  { id: 'jago', name: 'Jago', type: 'bank', color: '#F8A145' },
  { id: 'seabank', name: 'SeaBank', type: 'bank', color: '#FF7B00' },
  { id: 'gopay', name: 'GoPay', type: 'ewallet', color: '#00AED6' },
  { id: 'gojek', name: 'Gojek', type: 'ewallet', color: '#00AA13' },
  { id: 'grab', name: 'Grab', type: 'ewallet', color: '#00B14F' },
  { id: 'ovo', name: 'OVO', type: 'ewallet', color: '#4C3494' },
  { id: 'dana', name: 'DANA', type: 'ewallet', color: '#118EEA' },
  { id: 'shopeepay', name: 'ShopeePay', type: 'ewallet', color: '#EE4D2D' },
  { id: 'linkaja', name: 'LinkAja', type: 'ewallet', color: '#DF1921' },
];

export const getAccountIconDetails = (iconId?: string) => {
  return ACCOUNT_ICONS.find(i => i.id === iconId) || ACCOUNT_ICONS[0];
};

const CustomSvgIcon = ({ iconId, color }: { iconId: string, color: string }) => {
  switch (iconId) {
    case 'bca':
      return (
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
          <text x="50" y="65" fontFamily="sans-serif" fontWeight="900" fontStyle="italic" fontSize="42" fill={color} textAnchor="middle" letterSpacing="-2">BCA</text>
        </svg>
      );
    case 'bni':
      return (
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
          <text x="50" y="65" fontFamily="sans-serif" fontWeight="900" fontStyle="italic" fontSize="42" fill={color} textAnchor="middle" letterSpacing="-1">BNI</text>
        </svg>
      );
    case 'bri':
      return (
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
          <text x="50" y="65" fontFamily="serif" fontWeight="bold" fontSize="40" fill={color} textAnchor="middle">BRI</text>
        </svg>
      );
    case 'mandiri':
      return (
        <svg viewBox="0 0 100 100" className="w-[90%] h-[90%]">
          <text x="50" y="60" fontFamily="sans-serif" fontWeight="bold" fontStyle="italic" fontSize="26" fill={color} textAnchor="middle">mandiri</text>
          <rect x="25" y="68" width="50" height="5" fill="#FBBF24" />
        </svg>
      );
    case 'bsi':
      return (
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
          <text x="50" y="65" fontFamily="sans-serif" fontWeight="900" fontStyle="italic" fontSize="40" fill={color} textAnchor="middle">BSI</text>
        </svg>
      );
    case 'jago':
      return (
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
          <circle cx="25" cy="50" r="12" fill={color} />
          <text x="65" y="62" fontFamily="sans-serif" fontWeight="bold" fontSize="34" fill={color} textAnchor="middle">jago</text>
        </svg>
      );
    case 'seabank':
      return (
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
          <path d="M 20 60 Q 35 40 50 60 T 80 60" stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"/>
          <text x="50" y="45" fontFamily="sans-serif" fontWeight="bold" fontSize="26" fill={color} textAnchor="middle">Sea</text>
        </svg>
      );
    case 'gojek':
    case 'gopay':
      return (
        <svg viewBox="0 0 100 100" className="w-[70%] h-[70%]">
          <circle cx="50" cy="50" r="18" fill={color}/>
          <path d="M 20 50 C 20 20 80 20 80 50" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round"/>
        </svg>
      );
    case 'grab':
      return (
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
          <path d="M 15 75 Q 35 25 75 25 Q 55 45 85 55 Q 65 65 45 95 Z" fill={color} />
        </svg>
      );
    case 'ovo':
      return (
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
          <circle cx="28" cy="50" r="16" stroke={color} strokeWidth="10" fill="none"/>
          <path d="M 46 35 L 53 65 L 60 35" stroke={color} strokeWidth="10" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
          <circle cx="78" cy="50" r="16" stroke={color} strokeWidth="10" fill="none"/>
        </svg>
      );
    case 'dana':
      return (
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
          <path d="M 25 35 L 35 35 Q 55 35 55 50 Q 55 65 35 65 L 25 65 Z" fill={color}/>
          <path d="M 65 35 L 65 65" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none"/>
          <path d="M 75 35 L 75 65" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none"/>
        </svg>
      );
    case 'shopeepay':
      return (
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
          <path d="M 20 40 L 15 85 L 85 85 L 80 40 Z" fill={color}/>
          <path d="M 35 40 C 35 20 65 20 65 40" stroke={color} strokeWidth="8" fill="none"/>
          <text x="50" y="73" fontFamily="sans-serif" fontWeight="bold" fontSize="32" fill="white" textAnchor="middle">S</text>
        </svg>
      );
    case 'linkaja':
      return (
        <svg viewBox="0 0 100 100" className="w-[70%] h-[70%]">
          <path d="M 25 50 L 50 25 L 75 50 L 50 75 Z" fill={color} opacity="0.9"/>
          <path d="M 40 65 L 65 40 L 90 65 L 65 90 Z" fill={color} opacity="0.6"/>
        </svg>
      );
    default:
      return null;
  }
}

export const AccountIcon = ({ iconId, className }: { iconId?: string, className?: string }) => {
  const iconInfo = getAccountIconDetails(iconId);

  if (iconInfo.type === 'cash') {
    return (
      <div className={`flex items-center justify-center rounded-full border border-app-border bg-app-card shadow-sm text-app-success ${className}`}>
        <Banknote className="w-[60%] h-[60%]" strokeWidth={2} />
      </div>
    );
  }

  if (iconInfo.type === 'bank' || iconInfo.type === 'ewallet') {
    return (
      <div className={`flex items-center justify-center rounded-full border border-app-border bg-app-card shadow-sm overflow-hidden ${className}`}>
        <CustomSvgIcon iconId={iconInfo.id} color={iconInfo.color || '#000'} />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center rounded-full border border-app-border bg-app-card shadow-sm text-app-accent1 ${className}`}>
      <Wallet className="w-[60%] h-[60%]" strokeWidth={2} />
    </div>
  );
};
