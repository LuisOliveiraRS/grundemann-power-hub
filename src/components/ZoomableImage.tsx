import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2, X } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt: string;
}

const ZoomableImage = ({ src, alt }: ZoomableImageProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const clampPosition = useCallback((x: number, y: number, s: number) => {
    if (s <= 1) return { x: 0, y: 0 };
    const maxX = ((s - 1) * 50);
    const maxY = ((s - 1) * 50);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  const handleZoomIn = () => {
    setScale((s) => Math.min(s + 0.5, 5));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.5, 1);
    setScale(newScale);
    if (newScale <= 1) setPosition({ x: 0, y: 0 });
    else setPosition(clampPosition(position.x, position.y, newScale));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    const newScale = Math.max(1, Math.min(5, scale + delta));
    setScale(newScale);
    if (newScale <= 1) setPosition({ x: 0, y: 0 });
    else setPosition(clampPosition(position.x, position.y, newScale));
  }, [scale, position, clampPosition]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scale, position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || scale <= 1) return;
    const newPos = clampPosition(e.clientX - dragStart.x, e.clientY - dragStart.y, scale);
    setPosition(newPos);
  }, [isDragging, dragStart, scale, clampPosition]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch pinch-to-zoom
  const lastTouchDistance = useRef<number | null>(null);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (lastTouchDistance.current !== null) {
        const delta = (distance - lastTouchDistance.current) * 0.01;
        const newScale = Math.max(1, Math.min(5, scale + delta));
        setScale(newScale);
        if (newScale <= 1) setPosition({ x: 0, y: 0 });
      }
      lastTouchDistance.current = distance;
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null;
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      handleReset();
    }
  }, [isFullscreen]);

  const imageContent = (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${isFullscreen ? "w-full h-full" : "max-h-[400px]"}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in", touchAction: "none" }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full object-contain pointer-events-none"
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
          maxHeight: isFullscreen ? "calc(100vh - 120px)" : "400px",
        }}
        draggable={false}
      />
    </div>
  );

  const controls = (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={handleZoomOut}
        disabled={scale <= 1}
        className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground disabled:opacity-30 transition-colors"
        title="Diminuir zoom"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      <span className="text-xs font-bold text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
      <button
        onClick={handleZoomIn}
        disabled={scale >= 5}
        className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground disabled:opacity-30 transition-colors"
        title="Aumentar zoom"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors ml-1"
        title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
      >
        {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border bg-card">
          <p className="text-xs font-bold text-muted-foreground">{alt}</p>
          {controls}
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          {imageContent}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between p-2 bg-muted/50 border-b border-border">
        <p className="text-xs font-bold text-muted-foreground">{alt}</p>
        {controls}
      </div>
      {imageContent}
    </div>
  );
};

export default ZoomableImage;
