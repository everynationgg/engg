import { useState, useEffect } from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * useParallax
 * Returns dampened X and Y motion values based on mouse position relative to the screen center.
 * Perfect for creating floating HUD elements that 'lean' with mouse movement.
 */
export function useParallax(strength = 20) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for fluid, premium movement
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Transform values into pixels based on strength
  const x = useTransform(smoothX, [-0.5, 0.5], [-strength, strength]);
  const y = useTransform(smoothY, [-0.5, 0.5], [-strength, strength]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate position from -0.5 to 0.5
      const xPercent = (e.clientX / window.innerWidth) - 0.5;
      const yPercent = (e.clientY / window.innerHeight) - 0.5;
      
      mouseX.set(xPercent);
      mouseY.set(yPercent);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return { x, y };
}
