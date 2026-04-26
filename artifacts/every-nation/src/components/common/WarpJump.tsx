import { motion } from "framer-motion";

interface WarpJumpProps {
  onComplete?: () => void;
}

export default function WarpJump({ onComplete }: WarpJumpProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[2000] bg-black flex items-center justify-center overflow-hidden pointer-events-none"
    >
      {[...Array(80)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scaleX: 0, opacity: 0 }}
          animate={{ 
            scaleX: [0, 80], 
            opacity: [0, 1, 0],
            x: (Math.random() - 0.5) * 3000,
            y: (Math.random() - 0.5) * 3000
          }}
          transition={{ 
            duration: 0.8, 
            ease: "circIn", 
            delay: Math.random() * 0.1 
          }}
          className="absolute h-0.5 bg-white rounded-full shadow-[0_0_10px_white]"
          style={{ width: '60px' }}
        />
      ))}
    </motion.div>
  );
}
