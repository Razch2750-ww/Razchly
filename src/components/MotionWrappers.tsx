import React from 'react';
import { motion, useMotionValue, useSpring, useTransform, useScroll } from 'motion/react';

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
  const spotlightX = useMotionValue(0);
  const spotlightY = useMotionValue(0);
  const [isHovered, setIsHovered] = React.useState(false);

  // Map mouse coordinate ratios (-0.5 to 0.5) to a rotation range (-1.2 to 1.2 degrees)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [1.2, -1.2]), cardSpringConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-1.2, 1.2]), cardSpringConfig);
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

    spotlightX.set(e.clientX - rect.left);
    spotlightY.set(e.clientY - rect.top);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    scale.set(1.015); // subtle scale up for extra premium touch
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    scale.set(1);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      id={id}
      className={`relative ${className} select-none overflow-hidden group`}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        willChange: 'transform',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Spotlight Backglow effect */}
      <motion.div
        className="absolute inset-0 -z-10 pointer-events-none transition-opacity duration-300"
        style={{
          background: 'var(--color-app-accent1)',
          opacity: isHovered ? 0.04 : 0,
        }}
      />
      {/* Outer border glow effect on hover */}
      <div 
        className="absolute inset-0 rounded-[inherit] border border-app-accent1/20 transition-opacity duration-300 pointer-events-none -z-10"
        style={{
          boxShadow: '0 0 20px -3px var(--color-app-accent1)',
          opacity: isHovered ? 0.12 : 0,
        }}
      />
      <div className="h-full w-full relative z-10">
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

export const staggerItemVariants: any = {
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
  onClick?: (e: any) => void;
  [key: string]: any;
}

export function StaggerItem({ children, className = '', id, ...props }: StaggerItemProps) {
  return (
    <motion.div
      id={id}
      className={className}
      variants={staggerItemVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface TextRevealProps {
  text: string;
  className?: string;
  id?: string;
}

/**
 * TextReveal splits text into words and animates each up vertically
 * from an overflow-hidden mask for a highly premium, cinematic layout load.
 */
export function TextReveal({ text, className = '', id }: TextRevealProps) {
  const words = text.split(' ');
  return (
    <span id={id} className={`${className} inline-flex flex-wrap gap-x-[0.22em] overflow-hidden`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden py-[0.1em] -my-[0.1em]">
          <motion.span
            className="inline-block"
            initial={{ y: '115%' }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1], // fluid ease-out quartic
              delay: i * 0.035,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

interface ShimmerLoaderProps {
  className?: string;
  width?: string;
  height?: string;
  id?: string;
}

/**
 * ShimmerLoader provides a premium diagonal-sweep light animation
 * as a placeholder when loading or processing remote services.
 */
export function ShimmerLoader({ className = '', width = '100%', height = '1rem', id }: ShimmerLoaderProps) {
  return (
    <div
      id={id}
      className={`shimmer-element rounded-lg ${className}`}
      style={{ width, height }}
    />
  );
}

interface FloatingFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
  containerClassName?: string;
}

/**
 * FloatingField renders a text-field with a highly responsive floating label
 * and a premium focus soft-glow border ring.
 */
export function FloatingField({ label, className = '', containerClassName = '', value, onChange, ...props }: FloatingFieldProps) {
  const [focused, setFocused] = React.useState(false);
  const hasValue = value !== undefined && value !== '';

  return (
    <div className={`floating-control-container relative ${containerClassName}`}>
      <input
        {...props}
        value={value}
        onChange={onChange}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className={`w-full bg-app-card/65 border border-app-border rounded-xl px-4 pt-6 pb-2 text-app-text-bright text-sm transition-all focus:border-app-accent1 focus:ring-2 focus:ring-app-accent1/20 focus:outline-none placeholder-transparent ${className}`}
        placeholder={label}
      />
      <label
        className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-app-text/60 transition-all duration-200 origin-left select-none
          ${(focused || hasValue) ? 'scale-85 -translate-y-[120%] text-app-accent1' : ''}
        `}
      >
        {label}
      </label>
    </div>
  );
}

interface ParallaxBgProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // Slower velocity fraction (0.1 to 0.4)
}

/**
 * ParallaxBg adds standard translate-y parallax shift relative to page scrolling.
 */
export function ParallaxBg({ children, className = '', speed = 0.15 }: ParallaxBgProps) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, -800 * speed]);

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

interface WaggleIconProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * WaggleIcon wraps icons in empty or warning states to add a gentle
 * and attractive periodic rotation/waggle loop.
 */
export function WaggleIcon({ children, className = '' }: WaggleIconProps) {
  return (
    <div className={`animate-waggle inline-block ${className}`}>
      {children}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-app-card/40 rounded-xl border border-app-border/40 ${className}`}>
      <div className="absolute inset-0 shimmer-bg" />
    </div>
  );
}

interface MicroLoopProps {
  children: React.ReactNode;
  className?: string;
  type?: 'waggle' | 'pulse' | 'float';
}

export function MicroLoop({ children, className = '', type = 'waggle' }: MicroLoopProps) {
  const variants: any = {
    waggle: {
      rotate: [0, -3, 3, -3, 3, 0],
      transition: {
        duration: 1.5,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatDelay: 3
      }
    },
    pulse: {
      scale: [1, 1.03, 0.97, 1.02, 1],
      transition: {
        duration: 2,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatDelay: 3
      }
    },
    float: {
      y: [0, -6, 0],
      transition: {
        duration: 2.5,
        ease: 'easeInOut',
        repeat: Infinity,
      }
    }
  };

  return (
    <motion.div
      className={`inline-block ${className}`}
      animate={type}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

interface ParallaxBackgroundProps {
  containerRef: React.RefObject<HTMLElement>;
}

export function ParallaxBackground({ containerRef }: ParallaxBackgroundProps) {
  const { scrollY } = useScroll({ container: containerRef });
  
  // Multi-layered speed depths (moving 30% to 50% slower than main scrolling content)
  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -200]);
  const y3 = useTransform(scrollY, [0, 1000], [0, 150]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-20">
      {/* Glow blob 1 - Depth layer 1 */}
      <motion.div
        style={{ y: y1 }}
        className="absolute top-24 left-[10%] w-[25vw] h-[25vw] rounded-full bg-app-accent1/10 blur-[80px] opacity-35"
      />
      {/* Glow blob 2 - Depth layer 2 */}
      <motion.div
        style={{ y: y2 }}
        className="absolute top-[50vh] right-[15%] w-[30vw] h-[30vw] rounded-full bg-app-accent2/8 blur-[100px] opacity-25"
      />
      {/* Fine particle ring / Accent Blob 3 - Depth layer 3 */}
      <motion.div
        style={{ y: y3 }}
        className="absolute top-[100vh] left-[25%] w-[15vw] h-[15vw] rounded-full border border-app-accent1/10 bg-app-accent1/3 blur-[40px] opacity-20"
      />
    </div>
  );
}
