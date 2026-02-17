import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    actions?: React.ReactNode;
}

export function PageHeader({ icon: Icon, title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="page-header">
            <div className="header-title">
                <div className="header-icon">
                    <Icon size={24} />
                </div>
                <div>
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>
            </div>
            {actions && <div className="header-actions">{actions}</div>}
        </div>
    );
}
