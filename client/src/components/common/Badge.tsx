import React from 'react';
import './Badge.css';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
    size?: 'sm' | 'md';
    rounded?: boolean;
    className?: string;
}

export function Badge({
    children,
    variant = 'default',
    size = 'sm',
    rounded = false,
    className = ''
}: BadgeProps) {
    return (
        <span className={`badge badge-${variant} badge-${size} ${rounded ? 'badge-rounded' : ''} ${className}`}>
            {children}
        </span>
    );
}

interface UrgencyBadgeProps {
    level: string;
    size?: 'sm' | 'md';
    className?: string;
}

export function UrgencyBadge({ level, size = 'sm', className = '' }: UrgencyBadgeProps) {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
        low: 'success',
        medium: 'info',
        high: 'warning',
        critical: 'danger'
    };

    return (
        <Badge variant={variants[level] || 'info'} size={size} className={className}>
            {level ? level.toUpperCase() : 'UNKNOWN'}
        </Badge>
    );
}
