import React from 'react';
import './GlassCard.css';

interface GlassCardProps {
    children: React.ReactNode;
    variant?: 'default' | 'liquid';
    className?: string;
    onClick?: () => void;
    hover?: boolean;
}

export function GlassCard({
    children,
    variant = 'default',
    className = '',
    onClick,
    hover = false
}: GlassCardProps) {
    return (
        <div
            className={`glass-card-component ${variant === 'liquid' ? 'glass-card-liquid-component' : ''} ${hover ? 'glass-card-hover' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
