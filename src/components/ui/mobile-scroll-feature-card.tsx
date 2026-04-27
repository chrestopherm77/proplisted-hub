import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface MobileScrollFeatureCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper que aplica um efeito de scroll-driven reveal (fade + slide-up + scale)
 * APENAS no mobile (<768px). No desktop o card é renderizado sem animação,
 * mantendo o grid normal.
 */
export const MobileScrollFeatureCard: React.FC<MobileScrollFeatureCardProps> = ({
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.5], [0, 0.6, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [80, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.85, 1]);

  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  if (!isMobile || prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div ref={ref} style={{ opacity, y, scale }} className={className}>
      {children}
    </motion.div>
  );
};
