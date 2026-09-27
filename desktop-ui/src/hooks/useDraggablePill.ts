import { useState, useEffect, useRef } from "react";
import type { Position } from "../types/widget.ts";

export type DockSide = "left" | "right" | "top" | "bottom" | null;

export function useDraggablePill() {
  const [pos, setPos] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDocked, setIsDocked] = useState<DockSide>(null);

  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent drag initiation from inner interactive buttons
    if ((e.target as HTMLElement).closest("button")) return;

    setIsDragging(true);
    setIsDocked(null);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: pos.x,
      initY: pos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      setPos({
        x: dragStartRef.current.initX + dx,
        y: dragStartRef.current.initY + dy,
      });
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);

      // Magnetic Snapping & Wall Docking Logic:
      // Snaps securely to screen wall perimeter when dropped near borders
      setPos((current) => {
        const snapThreshold = 70;
        let newX = current.x;
        let newY = current.y;
        let docked: DockSide = null;

        const maxW = Math.max(window.innerWidth / 2 - 180, 20);
        const maxH = Math.max(window.innerHeight / 2 - 40, 20);

        // Right Wall Docking
        if (Math.abs(current.x - maxW) < snapThreshold || current.x > maxW) {
          newX = maxW;
          docked = "right";
        }
        // Left Wall Docking
        else if (Math.abs(current.x + maxW) < snapThreshold || current.x < -maxW) {
          newX = -maxW;
          docked = "left";
        }

        // Bottom Wall Docking
        if (Math.abs(current.y - maxH) < snapThreshold || current.y > maxH) {
          newY = maxH;
          docked = docked ?? "bottom";
        }
        // Top Wall Docking
        else if (Math.abs(current.y + maxH) < snapThreshold || current.y < -maxH) {
          newY = -maxH;
          docked = docked ?? "top";
        }

        setIsDocked(docked);
        return { x: newX, y: newY };
      });
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return { pos, isDragging, isDocked, handleMouseDown };
}
