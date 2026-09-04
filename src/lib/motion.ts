import {
  MotionConfig,
  LazyMotion,
  m,
  AnimatePresence,
  useReducedMotion,
  domAnimation,
  type Variants,
  type TargetAndTransition,
} from "framer-motion";

export {
  MotionConfig,
  LazyMotion,
  m,
  AnimatePresence,
  useReducedMotion,
  domAnimation,
  type Variants,
  type TargetAndTransition,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1 },
};

export const listStagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 40,
      delayChildren: 60,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 40,
      delayChildren: 60,
    },
  },
};

export const stepSwap: Variants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
};
