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
