"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ZoomableImageProps {
  imageUrl: string;
  onClose: () => void;
}

export function ZoomableImage({ imageUrl, onClose }: ZoomableImageProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.body.style.overflow = "hidden";
    document.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("touchmove", preventDefault);
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prevScale) =>
      Math.max(1, Math.min(3, prevScale - e.deltaY * 0.005))
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch1.clientX - touch2.clientX, 2) +
          Math.pow(touch1.clientY - touch2.clientY, 2)
      );
      setScale((prevScale) =>
        Math.max(1, Math.min(3, prevScale + distance * 0.00005))
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative w-full h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        <div
          ref={containerRef}
          className="w-full h-full overflow-hidden cursor-move"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          <img
            src={imageUrl || "/placeholder.svg"}
            alt="Zoomed product"
            className="w-full h-full object-contain"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${
                position.y / scale
              }px)`,
              transition: isDragging ? "none" : "transform 0.1s",
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
