import { type Transition } from 'motion/react';

/**
 * Apple-inspired motion transitions & spring physics.
 * Tuned for natural, responsive, snappy feedback without causing UI delays.
 */

// Snappy micro-interactions (buttons, pills, switches)
export const appleSnappy: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  mass: 0.5,
};

// Natural spring for modals, popovers, segmented controls
export const appleSpring: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 28,
  mass: 0.8,
};

// Smooth sheet / drawer transition
export const appleSheetSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 1,
};

// Subtle dropdown / popover scale & fade
export const appleDropdownSpring: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 26,
  mass: 0.7,
};

// Gentle fade for backdrops
export const appleFade: Transition = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1],
};
