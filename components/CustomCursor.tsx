import React, { useEffect, useState } from 'react';

const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const updateHoverState = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check for clickable elements
      setIsHovering(
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') !== null || 
        target.closest('a') !== null ||
        target.closest('.glass-card') !== null
      );
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('mouseover', updateHoverState);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('mouseover', updateHoverState);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <>
      {/* Outer Targeting Ring */}
      <div 
        className="fixed pointer-events-none z-[9999] rounded-full border border-brand-red transition-all duration-150 ease-out"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isHovering ? '48px' : '24px',
          height: isHovering ? '48px' : '24px',
          transform: `translate(-50%, -50%) scale(${isClicked ? 0.9 : 1}) rotate(${isHovering ? '45deg' : '0deg'})`,
          backgroundColor: isHovering ? 'rgba(220, 20, 60, 0.05)' : 'transparent',
          borderWidth: isHovering ? '1px' : '1.5px',
          opacity: 0.8
        }}
      >
        {/* Crosshair accents when hovering */}
        <div 
           className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1px] bg-brand-red transition-all duration-300 ${isHovering ? 'h-full' : 'h-0'}`}
        />
        <div 
           className={`absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-brand-red transition-all duration-300 ${isHovering ? 'w-full' : 'w-0'}`}
        />
      </div>

      {/* Inner Precision Dot */}
      <div 
        className="fixed pointer-events-none z-[9999] rounded-full bg-brand-red transition-all duration-75 ease-out shadow-[0_0_10px_rgba(220,20,60,0.5)]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isHovering ? '4px' : '6px',
          height: isHovering ? '4px' : '6px',
          transform: 'translate(-50%, -50%)'
        }}
      />
    </>
  );
};

export default CustomCursor;