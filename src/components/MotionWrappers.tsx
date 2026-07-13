import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

// Spring config for nice, premium elasticity (spring physics)
const cardSpringConfig = { damping: 15, stiffness: 120, mass: 0.8 };

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
}

/**
 * HoverCard is an interactive card component that tilts slightly (max 1.5 degrees)
 * following the user's cursor with bouncy spring physics, creating a high-end feel.
 */
export function HoverCard({ children, className = '', onClick, id }: HoverCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map mouse coordinate ratios (-0.5 to 0.5) to a rotation range (-1.5 to 1.5 degrees)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [1.5, -1.5]), cardSpringConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-1.5, 1.5]), cardSpringConfig);
  const scale = useSpring(1, cardSpringConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Relative coordinates (-0.5 to 0.5)
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseEnter = () => {
    scale.set(1.02); // slight scale up (scale-102) as requested
  };

  const handleMouseLeave = () => {
    scale.set(1);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      id={id}
      className={`${className} select-none`}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        scale,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="h-full w-full">
        {children}
      </div>
    </motion.div>
  );
}

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}

/**
 * ScrollReveal renders a subtle vertical slide (20px) and fade-in
 * when entering the viewport, with a clean 400ms transition.
 */
export function ScrollReveal({ children, className = '', delay = 0, id }: ScrollRevealProps) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.4,
        ease: 'easeOut',
        delay: delay,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer coordinates staggered loading of multiple child StaggerItems
 */
export const staggerContainerVariants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function StaggerContainer({ children, className = '', id }: StaggerContainerProps) {
  return (
    <motion.div
      id={id}
      className={className}
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-20px' }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function StaggerItem({ children, className = '', id }: StaggerItemProps) {
  return (
    <motion.div
      id={id}
      className={className}
      variants={staggerItemVariants}
    >
      {children}
    </motion.div>
  );
}

/* ======================== NEW PREMIUM COMPONENTS ======================== */

interface TextRevealProps {
  text: string;
  className?: string;
  duration?: number;
  staggerDelay?: number;
  id?: string;
}

/**
 * TextReveal - Dynamic Typography with per-word reveal animation
 * Text appears to slide up from bottom with smooth clip-path reveal
 * Duration: 600ms by default, ease-out for smooth cinematic effect
 */
export function TextReveal({ 
  text, 
  className = '', 
  duration = 0.6, 
  staggerDelay = 0.08,
  id 
}: TextRevealProps) {
  const words = text.split(' ');

  return (
    <div id={id} className={`flex flex-wrap gap-2 ${className}`}>
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          className="word-reveal inline-block"
          initial={{ opacity: 0, y: 20, clipPath: 'inset(0 0 100% 0)' }}
          animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0 0)' }}
          transition={{
            duration,
            ease: 'easeOut',
            delay: idx * staggerDelay,
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

interface SkeletonLoaderProps {
  count?: number;
  type?: 'text' | 'card' | 'avatar' | 'button' | 'line' | 'custom';
  className?: string;
  id?: string;
}

/**
 * SkeletonLoader - Smooth shimmer effect (not blinking)
 * Uses diagonal gradient animation with 2s duration
 * Perfect for loading states in data-heavy areas
 */
export function SkeletonLoader({
  count = 3,
  type = 'text',
  className = '',
  id,
}: SkeletonLoaderProps) {
  const skeletonClasses = {
    text: 'skeleton-text',
    card: 'skeleton-card',
    avatar: 'skeleton-avatar',
    button: 'skeleton-button',
    line: 'skeleton-line',
    custom: 'skeleton',
  };

  const classes = skeletonClasses[type];

  return (
    <div id={id} className={`loading-container ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={classes} />
      ))}
    </div>
  );
}

interface FloatingFormGroupProps {
  id?: string;
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
}

/**
 * FloatingFormGroup - Interactive floating labels with soft glow
 * Label animates up and shrinks when field is focused or has value
 * Soft glow border effect on focus (150ms transition)
 */
export function FloatingFormGroup({
  id,
  label,
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  onFocus,
  onBlur,
  error,
  disabled = false,
  multiline = false,
  rows = 3,
  className = '',
}: FloatingFormGroupProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const hasValue = value && value.toString().length > 0;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <div className={`form-group ${className}`}>
      {multiline ? (
        <textarea
          id={id}
          className={`floating-input ${error ? 'border-red-500' : ''} ${isFocused ? 'input-glow' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          rows={rows}
        />
      ) : (
        <input
          id={id}
          type={type}
          className={`floating-input ${error ? 'border-red-500' : ''} ${isFocused ? 'input-glow' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
        />
      )}
      <label className={`floating-label ${(isFocused || hasValue) ? 'translate-y-[-25px] scale-85 opacity-100' : ''}`}>
        {label}
      </label>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

interface ParallaxBackgroundProps {
  children: React.ReactNode;
  backgroundImage?: string;
  offset?: number;
  speed?: number;
  className?: string;
  id?: string;
}

/**
 * ParallaxBackground - Depth of field effect
 * Background moves 30% slower than foreground (1 - speed)
 * Creates 3D layered effect that removes flat appearance
 */
export function ParallaxBackground({
  children,
  backgroundImage,
  offset = 0,
  speed = 0.3,
  className = '',
  id,
}: ParallaxBackgroundProps) {
  const [scrollY, setScrollY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxY = scrollY * speed;

  return (
    <div
      id={id}
      className={`parallax-container relative overflow-hidden ${className}`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {backgroundImage && (
        <div
          className="parallax-bg absolute inset-0 -z-10"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${parallaxY}px)`,
          }}
        />
      )}
      <div className="parallax-content relative z-10">
        {children}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  animated?: boolean;
  className?: string;
  id?: string;
}

/**
 * EmptyState - Expressive empty state with micro-looping animation
 * Icon performs gentle waggle animation (tilts slightly, bobs up/down)
 * Perfect for cart, no results, or placeholder screens
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  animated = true,
  className = '',
  id,
}: EmptyStateProps) {
  return (
    <div id={id} className={`empty-state-container ${className}`}>
      {icon && (
        <div className={animated ? 'empty-state-icon' : 'text-4xl opacity-75 mb-4'}>
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-sm opacity-60 mb-4 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  animated?: boolean;
  className?: string;
  id?: string;
}

/**
 * ErrorState - Error display with micro-animation
 * Icon performs subtle waggle for visual interest without distraction
 */
export function ErrorState({
  icon,
  title,
  message,
  action,
  animated = true,
  className = '',
  id,
}: ErrorStateProps) {
  return (
    <div id={id} className={`empty-state-container ${className}`}>
      {icon && (
        <div className={animated ? 'error-icon mb-4' : 'text-5xl opacity-70 mb-4'}>
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2 text-red-500">{title}</h3>
      {message && <p className="text-sm opacity-60 mb-4 max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface PremiumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  id?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * PremiumButton - Button with premium micro-interactions
 * Smooth hover scale, soft shadow, and focus ring
 */
export function PremiumButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  id,
  type = 'button',
}: PremiumButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3.5 text-lg',
  };

  return (
    <motion.button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-premium ${variantClasses[variant]} ${sizeClasses[size]} focus-ring-primary ${className}`}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
}
