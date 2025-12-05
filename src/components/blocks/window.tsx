import { useState, useRef, useEffect } from 'react';
import WindowButton from '../ui/windowButton';

function Window({ title, children, initialPosition, initialSize, onClose, onClick, shouldBlink }: { uuid?: number, title?: string, children: React.ReactNode, initialPosition?: { x: number, y: number }, initialSize?: { width: number, height: number }, onClose?: () => void, onClick?: (position: { x: number, y: number }) => void, shouldBlink?: boolean }) {
    const [position, setPosition] = useState(initialPosition || { x: 400, y: 400 });
    const [size, setSize] = useState(initialSize || { width: 500, height: 300 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeEdge, setResizeEdge] = useState<'left' | 'right' | 'bottom' | 'bottom-left' | 'bottom-right' | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [previousPosition, setPreviousPosition] = useState<{ x: number, y: number } | null>(null);
    const [previousSize, setPreviousSize] = useState<{ width: number, height: number } | null>(null);
    const windowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {

        const handleMouseMove = (e: MouseEvent) => {
            if (isFullscreen) return; // Ne pas permettre le déplacement/redimensionnement en mode plein écran
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
                    } else if (resizeEdge === 'bottom-left') {
                        // Redimensionnement depuis l'angle inférieur gauche
                        const deltaX = resizeStart.x - e.clientX;
                        const deltaY = e.clientY - resizeStart.y;
                        
                        // Calculer la nouvelle largeur et position X
                        const newWidthValue = resizeStart.width + deltaX;
                        const newLeft = resizeStart.left - deltaX;
                        const minLeft = parentRect.left;
                        const maxLeft = resizeStart.left + resizeStart.width - MIN_WIDTH;
                        
                        if (newLeft >= minLeft && newLeft <= maxLeft) {
                            newX = newLeft - parentRect.left;
                            newWidth = newWidthValue;
                        } else if (newLeft < minLeft) {
                            newX = 0;
                            newWidth = resizeStart.width + (resizeStart.left - minLeft);
                        } else {
                            newX = maxLeft - parentRect.left;
                            newWidth = MIN_WIDTH;
                        }
                        
                        // Calculer la nouvelle hauteur
                        const newHeightValue = resizeStart.height + deltaY;
                        const maxHeight = parentRect.height - position.y;
                        newHeight = Math.max(MIN_HEIGHT, Math.min(newHeightValue, maxHeight));
                    } else if (resizeEdge === 'bottom-right') {
                        // Redimensionnement depuis l'angle inférieur droit
                        const deltaX = e.clientX - resizeStart.x;
                        const deltaY = e.clientY - resizeStart.y;
                        
                        // Calculer la nouvelle largeur
                        const newWidthValue = resizeStart.width + deltaX;
                        const maxWidth = parentRect.width - position.x;
                        newWidth = Math.max(MIN_WIDTH, Math.min(newWidthValue, maxWidth));
                        
                        // Calculer la nouvelle hauteur
                        const newHeightValue = resizeStart.height + deltaY;
                        const maxHeight = parentRect.height - position.y;
                        newHeight = Math.max(MIN_HEIGHT, Math.min(newHeightValue, maxHeight));
                    }
                    
                    setSize({ width: newWidth, height: newHeight });
                    if (resizeEdge === 'left' || resizeEdge === 'bottom-left') {
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
    }, [isDragging, isResizing, resizeEdge, dragOffset, resizeStart, size, position, isFullscreen]);

    const handleTitleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isFullscreen) return; // Désactiver le déplacement en mode plein écran
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

    const handleResizeMouseDown = (e: React.MouseEvent, edge: 'left' | 'right' | 'bottom' | 'bottom-left' | 'bottom-right') => {
        e.stopPropagation();
        if (isFullscreen) return; // Désactiver le redimensionnement en mode plein écran
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

    const getResizeCursor = (edge: 'left' | 'right' | 'bottom' | 'bottom-left' | 'bottom-right') => {
        if (isResizing && resizeEdge === edge) {
            if (edge === 'bottom') return 'ns-resize';
            if (edge === 'left' || edge === 'right') return 'ew-resize';
            if (edge === 'bottom-left') return 'nesw-resize';
            if (edge === 'bottom-right') return 'nwse-resize';
        }
        if (edge === 'bottom') return 'ns-resize';
        if (edge === 'left' || edge === 'right') return 'ew-resize';
        if (edge === 'bottom-left') return 'nesw-resize';
        if (edge === 'bottom-right') return 'nwse-resize';
        return 'default';
    };

    const handleCloseWindow = () => {
        if (onClose) {
            onClose()
        }
    }

    const handleWindowClick = (_e: React.MouseEvent) => {
        // Ne pas déclencher onClick si on est en train de redimensionner ou de déplacer
        if (isResizing || isDragging) {
            return
        }
        if (onClick) {
            onClick(position)
        }
    }

    const toggleFullscreen = () => {
        if (windowRef.current) {
            const windowElement = windowRef.current;
            const parentElement = windowElement.offsetParent as HTMLElement;
            
            if (!isFullscreen) {
                // Entrer en mode plein écran : sauvegarder les valeurs actuelles
                setPreviousPosition({ ...position });
                setPreviousSize({ ...size });
                
                if (parentElement) {
                    const parentRect = parentElement.getBoundingClientRect();
                    const TOP_BAR_HEIGHT = 0; // h-6 = 24px
                    // Mettre la fenêtre en plein écran (pleine largeur et pleine hauteur)
                    // Laisser un espace en haut pour la top bar (24px)
                    setPosition({ x: 0, y: TOP_BAR_HEIGHT });
                    setSize({ 
                        width: parentRect.width, 
                        height: parentRect.height - TOP_BAR_HEIGHT 
                    });
                }
                setIsFullscreen(true);
            } else {
                // Sortir du mode plein écran : restaurer les valeurs sauvegardées
                if (previousPosition && previousSize) {
                    setPosition(previousPosition);
                    setSize(previousSize);
                }
                setIsFullscreen(false);
            }
        }
    }

    return (
        <div 
            ref={windowRef}
            className={`
            bg-zinc-700 
            absolute 
            shadow-xl
            shadow-zinc-800/50
            ${isFullscreen ? 'rounded-none' : 'rounded-lg'}
            overflow-hidden
            `}
            style={{
                top: `${position.y}px`,
                left: `${position.x}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                cursor: isDragging ? 'grabbing' : 'default',
                transition: isDragging || isResizing ? 'none' : 'top 0.3s ease-in-out, left 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out',
                animation: shouldBlink ? 'shadowBlink 0.33s ease-in-out 3' : undefined
            }}
            onClick={handleWindowClick}
        >
            {/* Bord gauche */}
            {!isFullscreen && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-zinc-600/50"
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        handleResizeMouseDown(e, 'left')
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: getResizeCursor('left') }}
                />
            )}
            
            {/* Bord droit */}
            {!isFullscreen && (
                <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-zinc-600/50"
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        handleResizeMouseDown(e, 'right')
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: getResizeCursor('right') }}
                />
            )}
            
            {/* Bord bas */}
            {!isFullscreen && (
                <div
                    className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-zinc-600/50"
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        handleResizeMouseDown(e, 'bottom')
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: getResizeCursor('bottom') }}
                />
            )}
            
            {/* Angle inférieur gauche */}
            {!isFullscreen && (
                <div
                    className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize hover:bg-zinc-600/50"
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        handleResizeMouseDown(e, 'bottom-left')
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: getResizeCursor('bottom-left') }}
                />
            )}
            
            {/* Angle inférieur droit */}
            {!isFullscreen && (
                <div
                    className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize hover:bg-zinc-600/50"
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        handleResizeMouseDown(e, 'bottom-right')
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: getResizeCursor('bottom-right') }}
                />
            )}

            <div 
                className="h-6 w-full flex items-center justify-between px-1 relative"
                
            >
                <div className="flex gap-1.5 ml-0.5 relative">
                    <WindowButton color="red" onClick={() => handleCloseWindow()}/>
                    <WindowButton color="yellow" />
                    <WindowButton color="green" onClick={toggleFullscreen} />
                </div>
                <div 
                    className={`text-xs text-zinc-300 font-bold relative ${isFullscreen ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`} 
                    onMouseDown={handleTitleMouseDown}
                >
                    {title || 'Window'}
                </div>
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
                overflow-scroll
                ">
                    {children}
            </div>
        </div>
    )
}

export default Window;