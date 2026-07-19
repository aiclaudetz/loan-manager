import { useState, useEffect } from 'react';

// Returns true when the viewport is at or below `breakpoint` px wide.
// Updates live on resize/orientation change (e.g. rotating a phone).
export const useIsMobile = (breakpoint = 900) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
