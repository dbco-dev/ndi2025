import { useState, useRef, useEffect } from 'react';
import WindowButton from '../ui/windowButton';

function Window({ uuid, title, children, initialPosition, initialSize, onClose }: { uuid?: number, title?: string, children: React.ReactNode, initialPosition?: { x: number, y: number }, initialSize?: { width: number, height: number }, onClose?: () => void }) {
    const [position, setPosition] = useState(initialPosition || { x: 400, y: 400 });
    const [size, setSize] = useState(initialSize || { width: 500, height: 300 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeEdge, setResizeEdge] = useState<'left' | 'right' | 'bottom' | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && windowRef.current) {
                const windowElement = windowRef.current;
                const parentElement = windowElement.offsetParent as HTMLElement;
                
                if (parentElement) {
                    const parentRect = parentElement.getBoundingClientRect();
                    const windowRect = windowElement.getBoundingClientRect();
                    const windowWidth = windowRect.width;
                    const windowHeight = windowRect.height;
                    
                    // Calculer la nouvelle position
                    let newX = e.clientX - dragOffset.x;
                    let newY = e.clientY - dragOffset.y;
                    
                    // Limiter aux bordures du parent
                    const minX = parentRect.left;
                    const maxX = parentRect.right - windowWidth;
                    const minY = parentRect.top;
                    const maxY = parentRect.bottom - windowHeight;
                    
                    // Appliquer les contraintes
                    newX = Math.max(minX, Math.min(newX, maxX));
                    newY = Math.max(minY, Math.min(newY, maxY));
                    
                    // Convertir en coordonnées relatives au parent
                    const relativeX = newX - parentRect.left;
                    const relativeY = newY - parentRect.top;
                    
                    setPosition({
                        x: relativeX,
                        y: relativeY
                    });
                } else {
                    // Fallback si pas de parent trouvé
                    setPosition({
                        x: e.clientX - dragOffset.x,
                        y: e.clientY - dragOffset.y
                    });
                }
            } else if (isResizing && windowRef.current && resizeEdge) {
                const windowElement = windowRef.current;
                const parentElement = windowElement.offsetParent as HTMLElement;
                
                if (parentElement) {
                    const parentRect = parentElement.getBoundingClientRect();
                    const MIN_WIDTH = 200;
                    const MIN_HEIGHT = 150;
                    
                    let newWidth = size.width;
                    let newHeight = size.height;
                    let newX = position.x;
                    
                    if (resizeEdge === 'right') {
                        const deltaX = e.clientX - resizeStart.x;
                        const newWidthValue = resizeStart.width + deltaX;
                        // Limiter à la bordure droite du parent
                        const maxWidth = parentRect.width - position.x;
                        newWidth = Math.max(MIN_WIDTH, Math.min(newWidthValue, maxWidth));
                    } else if (resizeEdge === 'left') {
                        const deltaX = resizeStart.x - e.clientX;
                        const newLeft = resizeStart.left - deltaX;
                        const minLeft = parentRect.left;
                        const maxLeft = resizeStart.left + resizeStart.width - MIN_WIDTH;
                        
                        if (newLeft >= minLeft && newLeft <= maxLeft) {
                            newX = newLeft - parentRect.left;
                            newWidth = resizeStart.width + deltaX;
                        } else if (newLeft < minLeft) {
                            newX = 0;
                            newWidth = resizeStart.width + (resizeStart.left - minLeft);
                        } else {
                            newX = maxLeft - parentRect.left;
                            newWidth = MIN_WIDTH;
                        }
                    } else if (resizeEdge === 'bottom') {
                        const deltaY = e.clientY - resizeStart.y;
                        const newHeightValue = resizeStart.height + deltaY;
                        // Limiter à la bordure basse du parent
                        const maxHeight = parentRect.height - position.y;
                        newHeight = Math.max(MIN_HEIGHT, Math.min(newHeightValue, maxHeight));
                    }
                    
                    setSize({ width: newWidth, height: newHeight });
                    if (resizeEdge === 'left') {
                        setPosition({ ...position, x: newX });
                    }
                }
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            setResizeEdge(null);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, resizeEdge, dragOffset, resizeStart, size, position]);

    const handleTitleMouseDown = (e: React.MouseEvent) => {
        if (windowRef.current) {
            const windowElement = windowRef.current;
            const windowRect = windowElement.getBoundingClientRect();
            
            // Calculer le décalage en coordonnées absolues (par rapport à la fenêtre)
            setDragOffset({
                x: e.clientX - windowRect.left,
                y: e.clientY - windowRect.top
            });
            setIsDragging(true);
        }
    };

    const handleResizeMouseDown = (e: React.MouseEvent, edge: 'left' | 'right' | 'bottom') => {
        e.stopPropagation();
        if (windowRef.current) {
            const windowElement = windowRef.current;
            const windowRect = windowElement.getBoundingClientRect();
            
            setResizeStart({
                x: e.clientX,
                y: e.clientY,
                width: windowRect.width,
                height: windowRect.height,
                left: windowRect.left
            });
            setResizeEdge(edge);
            setIsResizing(true);
        }
    };

    const getResizeCursor = (edge: 'left' | 'right' | 'bottom') => {
        if (isResizing && resizeEdge === edge) {
            return edge === 'bottom' ? 'ns-resize' : 'ew-resize';
        }
        return edge === 'bottom' ? 'ns-resize' : 'ew-resize';
    };

    const handleCloseWindow = () => {
        if (onClose) {
            onClose()
        }
    }

    return (
        <div 
            ref={windowRef}
            className="
            bg-zinc-700 
            absolute 
            shadow-xl
            shadow-zinc-800/50 
            rounded-lg
            overflow-hidden
            "
            style={{
                top: `${position.y}px`,
                left: `${position.x}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            {/* Bord gauche */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-zinc-600/50"
                onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
                style={{ cursor: getResizeCursor('left') }}
            />
            
            {/* Bord droit */}
            <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-zinc-600/50"
                onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
                style={{ cursor: getResizeCursor('right') }}
            />
            
            {/* Bord bas */}
            <div
                className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-zinc-600/50"
                onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
                style={{ cursor: getResizeCursor('bottom') }}
            />

            <div 
                className="h-6 w-full flex items-center justify-between px-1 relative"
                
            >
                <div className="flex gap-1.5 ml-0.5 relative">
                    <WindowButton color="red" onClick={() => handleCloseWindow()}/>
                    <WindowButton color="yellow" />
                    <WindowButton color="green" />
                </div>
                <div className="text-xs text-zinc-300 font-bold relative cursor-grab active:cursor-grabbing" onMouseDown={handleTitleMouseDown}>{title || 'Window'}</div>
                <div className="text-xs text-zinc-300 font-bold w-9.5"></div>

            </div>
            <div className="
                bg-white 
                absolute 
                top-6
                left-1 
                bottom-1
                right-1
                flex 
                items-center justify-between
                rounded-sm
                overflow-hidden
                ">
                    {children}
            </div>
        </div>
    )
}

export default Window;