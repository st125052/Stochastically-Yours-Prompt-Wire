import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface StreamingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export function StreamingText({
  text,
  speed = 30,
  onComplete,
  className = ""
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }

    if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
    // Only depend on currentIndex, text, speed, and onComplete.
    // Remove isComplete from dependencies to avoid unnecessary reruns.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, text, speed, onComplete]);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return (
    <div className={className}>
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop"
          }}
          className="inline-block w-2 h-4 ml-0.5 bg-primary-foreground dark:bg-primary"
        />
      )}
    </div>
  );
}
