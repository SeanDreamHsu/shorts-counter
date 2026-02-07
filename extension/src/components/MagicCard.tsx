/* MagicCard - Cursor glow effect with global mouse tracking support */
import { useRef, useCallback, useEffect, useState, createContext, useContext, type ReactNode } from 'react';
import './MagicCard.css';

// Context for global mouse position
interface MousePosition {
    x: number;
    y: number;
    isInGrid: boolean;
}

const MouseContext = createContext<MousePosition>({ x: 0, y: 0, isInGrid: false });

// MagicGrid - Wrapper that tracks mouse globally
interface MagicGridProps {
    children: ReactNode;
    className?: string;
}

export const MagicGrid = ({ children, className = '' }: MagicGridProps) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0, isInGrid: false });

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!gridRef.current) return;
        setMousePos({
            x: e.clientX,
            y: e.clientY,
            isInGrid: true
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setMousePos(prev => ({ ...prev, isInGrid: false }));
    }, []);

    return (
        <MouseContext.Provider value={mousePos}>
            <div
                ref={gridRef}
                className={`magic-grid ${className}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
        </MouseContext.Provider>
    );
};

// MagicCard - Individual card that responds to global mouse
interface MagicCardProps {
    children: ReactNode;
    className?: string;
    glowColor?: string;
    glowRadius?: number;
    borderRadius?: number;
    enableBorderGlow?: boolean;
}

const MagicCard = ({
    children,
    className = '',
    glowColor = '139, 92, 246',
    glowRadius = 200,
    borderRadius = 20,
    enableBorderGlow = true,
}: MagicCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const mousePos = useContext(MouseContext);
    const [glowState, setGlowState] = useState({ x: 50, y: 50, intensity: 0 });

    useEffect(() => {
        if (!cardRef.current || !mousePos.isInGrid) {
            setGlowState(prev => ({ ...prev, intensity: 0 }));
            return;
        }

        const rect = cardRef.current.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;

        // Calculate distance from mouse to card center
        const dx = mousePos.x - cardCenterX;
        const dy = mousePos.y - cardCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Max distance for glow effect
        const maxDistance = glowRadius * 1.5;

        // Calculate intensity based on distance (closer = stronger)
        const intensity = Math.max(0, 1 - (distance / maxDistance));

        // Calculate relative position within card
        const relativeX = ((mousePos.x - rect.left) / rect.width) * 100;
        const relativeY = ((mousePos.y - rect.top) / rect.height) * 100;

        // Clamp position for edge cases
        const clampedX = Math.max(-50, Math.min(150, relativeX));
        const clampedY = Math.max(-50, Math.min(150, relativeY));

        setGlowState({
            x: clampedX,
            y: clampedY,
            intensity: intensity
        });
    }, [mousePos, glowRadius]);

    return (
        <div
            ref={cardRef}
            className={`magic-card ${enableBorderGlow ? 'magic-card--border-glow' : ''} ${className}`}
            style={{
                '--glow-color': glowColor,
                '--glow-radius': `${glowRadius}px`,
                '--card-radius': `${borderRadius}px`,
                '--glow-x': `${glowState.x}%`,
                '--glow-y': `${glowState.y}%`,
                '--glow-intensity': glowState.intensity.toString(),
            } as React.CSSProperties}
        >
            {children}
        </div>
    );
};

export default MagicCard;
