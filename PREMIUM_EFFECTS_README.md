# 🎨 Premium UI Animations & Effects - Razchly

Panduan lengkap untuk menerapkan 5 efek premium yang membuat website terasa lebih hidup dan profesional.

## 📋 Quick Start

### 1. Import Components
```tsx
import { 
  TextReveal,           // Dynamic typography with per-word animation
  SkeletonLoader,       // Smooth shimmer loading state
  FloatingFormGroup,    // Interactive floating labels with glow
  ParallaxBackground,   // Depth of field parallax effect
  EmptyState,          // Expressive empty state with micro-animation
  ErrorState,          // Error display with micro-animation
  HoverCard,           // 3D hover card effect
  ScrollReveal,        // Scroll-triggered reveal
  PremiumButton,       // Premium button with micro-interactions
  StaggerContainer,    // Staggered animation container
  StaggerItem          // Individual stagger item
} from '@/components/MotionWrappers';

import { initializePremiumAnimations } from '@/utils/parallaxHelper';
```

### 2. Initialize in App
```tsx
useEffect(() => {
  // Initialize parallax and other effects on mount
  initializePremiumAnimations();
}, []);
```

---

## 🌈 5 Premium Effects Explained

### 1️⃣ **Text Reveal** - Dynamic Typography
**Apa:** Per-kata/per-huruf animasi teks yang slide-up dari bawah dengan clip-path effect.
**Durasi:** 600ms dengan ease-out (sinematik)
**Gunakan untuk:** Judul utama, heading halaman, modal titles

**Contoh:**
```tsx
<TextReveal 
  text="Dashboard Keuangan Anda"
  className="text-4xl font-bold"
  duration={0.6}
  staggerDelay={0.08}
/>
```

**Hasil:** Setiap kata muncul secara berurutan dengan efek elegant dan premium.

---

### 2️⃣ **Skeleton Loader** - Shimmer Effect
**Apa:** Loading state dengan gradien shimmer yang bergerak (bukan blinking).
**Durasi:** 2 detik loop infinite
**Gunakan untuk:** Saat data sedang di-fetch dari server

**Contoh:**
```tsx
{isLoading ? (
  <SkeletonLoader type="card" count={3} />
) : (
  // Render actual content
)}
```

**Tipe Skeleton:**
- `text` - untuk paragraf/list items
- `card` - untuk card sections
- `avatar` - untuk user avatars
- `button` - untuk button placeholders
- `line` - untuk single lines
- `custom` - generic skeleton

---

### 3️⃣ **Floating Form Labels** - Soft Glow
**Apa:** Label yang otomatis mengecil dan bergeser saat input fokus.
**Animasi:** Label naik (-25px) dan scale (0.85) dalam 150ms
**Glow:** Border soft glow biru saat focused

**Contoh:**
```tsx
<FloatingFormGroup
  id="amount"
  label="Jumlah Transaksi"
  type="number"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  error={errors?.amount}
  multiline={false}
/>
```

**Fitur:**
- ✅ Auto-floating saat fokus
- ✅ Auto-floating saat ada value
- ✅ Soft glow border effect
- ✅ Error message support
- ✅ Multiline textarea support
- ✅ Disabled state

---

### 4️⃣ **Parallax Background** - Depth of Field
**Apa:** Background bergerak 30% lebih lambat saat scroll (1 - speed).
**Effect:** Menghilangkan kesan datar, memberikan 3D depth
**Gunakan untuk:** Hero sections, headers, decorative backgrounds

**Contoh - Method 1 (Component):**
```tsx
<ParallaxBackground
  backgroundImage="/hero-pattern.jpg"
  speed={0.3}
  className="h-96 rounded-lg"
>
  <div className="p-8">
    <h1 className="text-4xl font-bold text-white">Welcome</h1>
  </div>
</ParallaxBackground>
```

**Contoh - Method 2 (Data Attributes):**
```tsx
<div data-parallax-speed="0.3" className="bg-cover h-96">
  Content dengan parallax effect
</div>
```

---

### 5️⃣ **Micro-Looping** - Empty & Error States
**Apa:** Icon yang perform subtle waggle/tilt+bob animation
**Durasi:** 3 detik per cycle, gentle dan non-intrusive
**Gunakan untuk:** Empty states, error pages, no results

**Contoh - Empty State:**
```tsx
<EmptyState
  icon={<ShoppingCart size={48} />}
  title="Keranjang Kosong"
  description="Mulai catat transaksi Anda"
  action={<button>Tambah Transaksi</button>}
  animated={true}
/>
```

**Contoh - Error State:**
```tsx
<ErrorState
  icon={<AlertCircle size={56} />}
  title="Terjadi Kesalahan"
  message="Gagal memuat data. Silakan coba lagi."
  action={<button>Coba Lagi</button>}
  animated={true}
/>
```

---

## 🎯 Implementation Checklist

### By Tab/Feature:

- [ ] **Login Page**
  - TextReveal untuk brand name dan headline
  - PremiumButton untuk auth buttons
  - Parallax background dengan pattern

- [ ] **Dashboard**
  - TextReveal untuk "Dashboard Keuangan Anda"
  - SkeletonLoader saat balance/data loading
  - StaggerContainer + StaggerItem untuk card list
  - ParallaxBackground untuk header section
  - EmptyState jika tidak ada transaksi

- [ ] **Transactions Tab**
  - TextReveal untuk page title
  - FloatingFormGroup untuk semua input
  - SkeletonLoader saat loading list
  - EmptyState jika belum ada transaksi
  - ParallaxBackground untuk section header

- [ ] **Investments Tab**
  - SkeletonLoader untuk card loading
  - HoverCard untuk investment items
  - EmptyState jika portfolio kosong
  - Parallax untuk header

- [ ] **Loans Tab**
  - FloatingFormGroup untuk input form
  - SkeletonLoader untuk loan list
  - EmptyState jika tidak ada loans

- [ ] **Attendance Tab**
  - TextReveal untuk calendar header
  - SkeletonLoader untuk calendar cells
  - StaggerContainer untuk attendance cards

- [ ] **Settings Page**
  - FloatingFormGroup untuk semua settings input
  - ParallaxBackground untuk section headers
  - PremiumButton untuk save action

- [ ] **Modals**
  - TextReveal untuk modal title
  - FloatingFormGroup untuk modal forms
  - PremiumButton untuk actions

---

## 🎨 CSS Classes Available

```css
/* Text animations */
.text-reveal           /* Apply text reveal animation */
.word-reveal           /* Per-word reveal */
.text-reveal-stagger   /* Staggered reveal on container */

/* Skeleton loaders */
.skeleton              /* Base shimmer skeleton */
.skeleton-text         /* Text skeleton h-4 */
.skeleton-card         /* Card skeleton h-40 */
.skeleton-avatar       /* Avatar skeleton h-12 w-12 rounded */
.skeleton-button       /* Button skeleton */
.skeleton-line         /* Single line skeleton */
.loading-container     /* Container for multiple skeletons */

/* Floating inputs */
.form-group            /* Form group wrapper */
.floating-input        /* Input with floating label */
.floating-label        /* Floating label element */
.input-glow            /* Glow effect on focus */

/* Parallax & depth */
.parallax-container    /* Container for parallax effect */
.parallax-bg           /* Background element */
.parallax-content      /* Content on top of parallax */

/* Animations */
.micro-waggle          /* 3s gentle waggle animation */
.subtle-float          /* 4s subtle floating animation */
.empty-state-icon      /* Icon with waggle */
.empty-state-container /* Empty state layout */
.error-icon            /* Error icon with waggle */

/* Premium utilities */
.card-premium          /* Premium card with backdrop blur */
.btn-premium           /* Premium button styling */
.text-gradient         /* Gradient text effect */
.transition-premium    /* 300ms smooth transition */
.focus-ring            /* Focus ring for accessibility */
.focus-ring-primary    /* Blue focus ring */
.backdrop-blur-premium /* Premium blur effect */
```

---

## 🔧 Advanced Configuration

### Custom Parallax Speed
```tsx
// Slower parallax (more dramatic)
<ParallaxBackground speed={0.5} />

// Faster parallax (subtle)
<ParallaxBackground speed={0.15} />
```

### Custom Text Reveal Timing
```tsx
<TextReveal 
  text="Your text here"
  duration={0.8}      // 800ms instead of 600ms
  staggerDelay={0.15} // 150ms delay between words
/>
```

### Custom Skeleton Types
```tsx
// Create custom loading structure
<div className="space-y-4">
  <div className="skeleton h-6 w-3/4" /> {/* Title */}
  <div className="skeleton h-4 w-full" /> {/* Description line 1 */}
  <div className="skeleton h-4 w-5/6" /> {/* Description line 2 */}
</div>
```

---

## 🌍 Data Attributes

For non-React elements, use data attributes:

```html
<!-- Parallax background -->
<div data-parallax-speed="0.3">Background element</div>

<!-- Floating animations -->
<div data-float-duration="4">Floating element</div>

<!-- Micro-waggle -->
<div data-micro-waggle="3">Icon element</div>
```

Then initialize in App:
```tsx
import { initializePremiumAnimations } from '@/utils/parallaxHelper';

useEffect(() => {
  initializePremiumAnimations();
}, []);
```

---

## ♿ Accessibility

Semua animasi menghormati `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Users yang prefer reduced motion akan melihat content tanpa animasi.

---

## 📊 Performance Tips

1. **Use SkeletonLoader** untuk data fetching (lebih smooth dari loading spinners)
2. **Parallax effects** gunakan dengan bijak (tidak di semua elemen)
3. **Will-change properties** sudah dioptimalkan di komponen
4. **GPU acceleration** via transform translate
5. **Passive event listeners** untuk scroll (non-blocking)

---

## 🐛 Troubleshooting

### Animasi tidak muncul?
- ✅ Pastikan `initializePremiumAnimations()` dipanggil di App.tsx
- ✅ Check browser console untuk errors
- ✅ Verifikasi Tailwind CSS ter-generate

### Parallax terasa janggal?
- ✅ Gunakan speed yang lebih kecil (0.2 atau 0.15)
- ✅ Pastikan container memiliki overflow hidden
- ✅ Check browser performance tab

### Form glow terlalu terang?
- ✅ Modify `@keyframes softGlow` di index.css
- ✅ Ubah `rgba(59, 130, 246, 0.3)` ke alpha lebih rendah

---

## 📁 Files Modified/Created

```
src/
├── index.css                          (✨ NEW KEYFRAMES & CLASSES)
├── components/
│   ├── MotionWrappers.tsx            (✨ ENHANCED - All new components)
│   └── Login.tsx                      (✨ UPDATED - With text reveal)
├── utils/
│   └── parallaxHelper.ts              (✨ NEW - Parallax utilities)
├── PREMIUM_EFFECTS_GUIDE.ts          (📖 NEW - Comprehensive guide)
└── IMPLEMENTATION_EXAMPLES.tsx        (📝 NEW - Code examples)
```

---

## 🚀 Next Steps

1. **Copy** komponen dari `MotionWrappers.tsx` ke komponen Anda
2. **Gunakan** contoh dari `IMPLEMENTATION_EXAMPLES.tsx` sebagai template
3. **Refer** ke `PREMIUM_EFFECTS_GUIDE.ts` untuk best practices
4. **Test** di berbagai halaman dan devices
5. **Optimize** berdasarkan feedback pengguna

---

## 💡 Tips & Best Practices

- **Jangan** gunakan semua efek sekaligus - pilih yang sesuai per halaman
- **Pair** TextReveal dengan ScrollReveal untuk efek yang lebih dramatic
- **Use** EmptyState dengan icon yang sesuai dengan konteks
- **Mobile** - kurangi parallax speed di mobile (user lebih suka smooth)
- **Test** dengan prefers-reduced-motion enabled

---

**Dibuat dengan ❤️ untuk Razchly**

Untuk pertanyaan atau improvement, check file guide dan examples di atas!
