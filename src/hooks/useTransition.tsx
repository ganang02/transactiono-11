
import React, { useState, useEffect } from "react";

export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayComponent, setDisplayComponent] = useState<React.ReactNode>(null);
  const [pendingComponent, setPendingComponent] = useState<React.ReactNode>(null);

  useEffect(() => {
    if (pendingComponent && !isTransitioning) {
      setIsTransitioning(true);
      
      // Wait for exit animation
      setTimeout(() => {
        setDisplayComponent(pendingComponent);
        setPendingComponent(null);
        
        // Wait for enter animation
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 300);
    }
  }, [pendingComponent, isTransitioning]);

  const transitionTo = (component: React.ReactNode) => {
    if (isTransitioning) return;
    setPendingComponent(component);
  };

  return {
    isTransitioning,
    displayComponent: displayComponent || pendingComponent,
    transitionTo,
  };
};

interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export const FadeTransition: React.FC<TransitionProps> = ({ 
  show, 
  children,
  className = "",
  duration = 300 
}) => {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) setShouldRender(true);
    
    let timeoutId: ReturnType<typeof setTimeout>;
    if (!show && shouldRender) {
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [show, duration, shouldRender]);
  
  const transitionClasses = `transition-all duration-${duration}`;
  const visibilityClass = show ? "opacity-100" : "opacity-0";

  if (!shouldRender) return null;
  
  return (
    <div className={`${transitionClasses} ${visibilityClass} ${className}`}>
      {children}
    </div>
  );
};

export const SlideUpTransition: React.FC<TransitionProps> = ({
  show,
  children,
  className = "",
  duration = 300
}) => {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) setShouldRender(true);
    
    let timeoutId: ReturnType<typeof setTimeout>;
    if (!show && shouldRender) {
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [show, duration, shouldRender]);
  
  const transitionClasses = `transition-all duration-${duration}`;
  const visibilityClass = show 
    ? "opacity-100 transform translate-y-0" 
    : "opacity-0 transform translate-y-4";

  if (!shouldRender) return null;
  
  return (
    <div className={`${transitionClasses} ${visibilityClass} ${className}`}>
      {children}
    </div>
  );
};
