import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
    LayoutDashboard, Briefcase, MessageSquare,
    Bell, Settings, User, LogOut, Search, Menu, X, Users, BarChart3, AlertTriangle, Shield
} from 'lucide-react';
import { ThemeToggle } from '../common';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/api';
import './DashboardLayout.css';

interface NavItem {
    icon: ReactNode;
    label: string;
    to: string;
}

const clientNav: NavItem[] = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', to: '/dashboard' },
    { icon: <Briefcase size={20} />, label: 'My Cases', to: '/dashboard/cases' },
    { icon: <Search size={20} />, label: 'Find Advocates', to: '/dashboard/advocates' },
    { icon: <MessageSquare size={20} />, label: 'AI Assistant', to: '/dashboard/chat' },
    { icon: <Bell size={20} />, label: 'Notifications', to: '/dashboard/notifications' },
    { icon: <Settings size={20} />, label: 'Settings', to: '/dashboard/settings' }
];

const advocateNav: NavItem[] = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', to: '/advocate' },
    { icon: <Briefcase size={20} />, label: 'Cases', to: '/advocate/cases' },
    { icon: <Users size={20} />, label: 'Requests', to: '/advocate/requests' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', to: '/advocate/analytics' },
    { icon: <Bell size={20} />, label: 'Notifications', to: '/advocate/notifications' },
    { icon: <User size={20} />, label: 'Profile', to: '/advocate/profile' }
];

const adminNav: NavItem[] = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', to: '/admin' },
    { icon: <Users size={20} />, label: 'Users', to: '/admin/users' },
    { icon: <Shield size={20} />, label: 'Advocates', to: '/admin/advocates' },
    { icon: <Briefcase size={20} />, label: 'Cases', to: '/admin/cases' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', to: '/admin/analytics' },
    { icon: <Settings size={20} />, label: 'Settings', to: '/admin/settings' },
    { icon: <User size={20} />, label: 'Profile', to: '/admin/profile' }
];

export function DashboardLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Watch for theme changes
        const observer = new MutationObserver(() => {
            const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
            setTheme(currentTheme || 'dark');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        // Initial theme
        setTheme((document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'dark');

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!user) return;
            try {
                const response = await notificationsAPI.getAll({ limit: 1 });
                if (response.data && response.data.data && typeof response.data.data.unreadCount === 'number') {
                    setUnreadCount(response.data.data.unreadCount);
                }
            } catch (error) {
                console.error('Failed to fetch notifications count', error);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, [user]);

    const navItems = user?.role === 'admin' ? adminNav :
        user?.role === 'advocate' ? advocateNav : clientNav;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path: string) => {
        if (path === '/dashboard' || path === '/advocate' || path === '/admin') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className={`dashboard-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-logo">
                        <span className="logo-text" style={{ fontSize: sidebarOpen ? '1.5rem' : '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #4f46e5, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {sidebarOpen ? 'Nexora' : 'N'}
                        </span>
                    </Link>
                    <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item, i) => (
                        <Link
                            key={i}
                            to={item.to}
                            className={`nav-item ${isActive(item.to) ? 'active' : ''}`}
                            title={!sidebarOpen ? item.label : undefined}
                        >
                            {item.icon}
                            {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="dashboard-main">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <Menu size={24} />
                        </button>
                        <div className="header-search">
                            <Search size={18} />
                            <input type="text" placeholder="Search cases, documents..." />
                        </div>
                    </div>
                    <div className="header-actions">
                        <ThemeToggle />
                        <Link to={`/${user?.role === 'client' ? 'dashboard' : user?.role}/notifications`} className="header-notification">
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                        </Link>
                        <div className="header-user">
                            <div className="user-avatar">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user?.name}</span>
                                <span className="user-role">{user?.role}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
