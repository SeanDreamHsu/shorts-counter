import React, { useRef } from 'react';

const AppleLiquidCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<number>(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!rootRef.current) return;

        const rect = rootRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(() => {
            if (rootRef.current) {
                rootRef.current.style.setProperty('--x', `${x}px`);
                rootRef.current.style.setProperty('--y', `${y}px`);
            }
        });
    };

    return (
        <div
            ref={rootRef}
            onMouseMove={handleMouseMove}
            className={`relative group rounded-[24px] p-[1px] ${className}`}
        >
            {/* Outer Glow (New) */}
            <div
                className="absolute -inset-[3px] rounded-[26px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-md
                           bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,50%),rgba(255,255,255,0.15)_0%,transparent_60%)]"
            />

            {/* Outer Border with Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-white/5 pointer-events-none rounded-[24px]" />

            {/* Main Container */}
            <div
                className="relative h-full w-full bg-white/40 dark:bg-black/20 
                           backdrop-blur-2xl backdrop-saturate-150
                           rounded-[23px] px-6 py-8
                           shadow-[0_20px_50px_rgba(0,0,0,0.1)]
                           overflow-hidden
                           before:absolute before:inset-0 before:rounded-[23px] 
                           before:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
            >

                {/* Fluid Animation Effect - Fainter (0.4 -> 0.15) */}
                <div
                    className="absolute -inset-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none
                               bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,50%),rgba(255,255,255,0.15)_0%,transparent_50%)]"
                />

                <div className="relative z-10 h-full">{children}</div>
            </div>
        </div>
    );
};

export default AppleLiquidCard;
