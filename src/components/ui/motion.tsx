
import React from 'react';
import { cn } from '@/lib/utils';

interface MotionProps extends React.HTMLAttributes<HTMLDivElement> {
  initial?: { [key: string]: number | string };
  animate?: { [key: string]: number | string };
  exit?: { [key: string]: number | string };
  transition?: { 
    duration?: number;
    delay?: number;
    [key: string]: any;
  };
  whileHover?: { [key: string]: number | string };
  whileTap?: { [key: string]: number | string };
  children: React.ReactNode;
}

export const motion = {
  div: ({
    children,
    className,
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileTap,
    ...props
  }: MotionProps) => {
    const animationClasses = cn(
      // Default animation classes
      'transition-all',
      // Apply duration from transition prop
      transition?.duration && `duration-${Math.round(transition.duration * 1000)}`,
      // Apply delay from transition prop
      transition?.delay && `delay-${Math.round(transition.delay * 1000)}`,
      // Apply other classes
      className
    );

    // Create CSS style object for animations
    const style: React.CSSProperties = {
      ...(props.style || {}),
    };

    // Apply initial animation properties
    if (initial) {
      Object.entries(initial).forEach(([key, value]) => {
        if (key === 'opacity') style.opacity = value as number;
        if (key === 'scale') style.transform = `scale(${value})`;
        if (key === 'y') style.transform = `${style.transform || ''} translateY(${value}px)`.trim();
        if (key === 'x') style.transform = `${style.transform || ''} translateX(${value}px)`.trim();
      });
    }

    // Apply animate properties (will override initial due to CSS transitions)
    if (animate) {
      Object.entries(animate).forEach(([key, value]) => {
        if (key === 'opacity') style.opacity = value as number;
        if (key === 'scale') style.transform = `scale(${value})`;
        if (key === 'y') style.transform = `${style.transform || ''} translateY(${value}px)`.trim();
        if (key === 'x') style.transform = `${style.transform || ''} translateX(${value}px)`.trim();
      });
    }

    // Create hover and tap event handlers
    const [isHovering, setIsHovering] = React.useState(false);
    const [isTapping, setIsTapping] = React.useState(false);

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);
    const handleMouseDown = () => setIsTapping(true);
    const handleMouseUp = () => setIsTapping(false);

    // Apply hover styles if currently hovering
    if (whileHover && isHovering) {
      Object.entries(whileHover).forEach(([key, value]) => {
        if (key === 'opacity') style.opacity = value as number;
        if (key === 'scale') style.transform = `scale(${value})`;
        if (key === 'y') style.transform = `${style.transform || ''} translateY(${value}px)`.trim();
        if (key === 'x') style.transform = `${style.transform || ''} translateX(${value}px)`.trim();
      });
    }

    // Apply tap styles if currently tapping
    if (whileTap && isTapping) {
      Object.entries(whileTap).forEach(([key, value]) => {
        if (key === 'opacity') style.opacity = value as number;
        if (key === 'scale') style.transform = `scale(${value})`;
        if (key === 'y') style.transform = `${style.transform || ''} translateY(${value}px)`.trim();
        if (key === 'x') style.transform = `${style.transform || ''} translateX(${value}px)`.trim();
      });
    }

    return (
      <div
        className={animationClasses}
        style={style}
        onMouseEnter={whileHover ? handleMouseEnter : undefined}
        onMouseLeave={whileHover ? handleMouseLeave : undefined}
        onMouseDown={whileTap ? handleMouseDown : undefined}
        onMouseUp={whileTap ? handleMouseUp : undefined}
        {...props}
      >
        {children}
      </div>
    );
  },
  h2: ({
    children,
    className,
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileTap,
    ...props
  }: MotionProps) => {
    const animationClasses = cn(
      'transition-all',
      transition?.duration && `duration-${Math.round(transition.duration * 1000)}`,
      transition?.delay && `delay-${Math.round(transition.delay * 1000)}`,
      className
    );

    const style: React.CSSProperties = {
      ...(props.style || {}),
    };

    if (initial) {
      Object.entries(initial).forEach(([key, value]) => {
        if (key === 'opacity') style.opacity = value as number;
        if (key === 'scale') style.transform = `scale(${value})`;
        if (key === 'y') style.transform = `${style.transform || ''} translateY(${value}px)`.trim();
        if (key === 'x') style.transform = `${style.transform || ''} translateX(${value}px)`.trim();
      });
    }

    if (animate) {
      Object.entries(animate).forEach(([key, value]) => {
        if (key === 'opacity') style.opacity = value as number;
        if (key === 'scale') style.transform = `scale(${value})`;
        if (key === 'y') style.transform = `${style.transform || ''} translateY(${value}px)`.trim();
        if (key === 'x') style.transform = `${style.transform || ''} translateX(${value}px)`.trim();
      });
    }

    return (
      <h2
        className={animationClasses}
        style={style}
        {...props}
      >
        {children}
      </h2>
    );
  }
};
