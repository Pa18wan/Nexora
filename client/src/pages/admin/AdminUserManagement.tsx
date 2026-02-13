import { useState, useEffect } from 'react';
import {
    Users, Search, Filter, MoreVertical, Shield,
    UserCheck, UserX, Mail, Phone, Calendar, RefreshCcw
} from 'lucide-react';
import { GlassCard, Button, Badge, Input } from '../../components/common';
import { adminAPI } from '../../services/api';
import './AdminUserManagement.css';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'client' | 'advocate' | 'admin';
    status: 'active' | 'suspended' | 'pending';
    createdAt: string;
    lastLogin?: string;
}

export function AdminUserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [filterRole]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (filterRole !== 'all') params.role = filterRole;

            const response = await adminAPI.getUsers(params);
            if (response.data.success) {
                setUsers(response.data.data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (userId: string, currentStatus: string) => {
        const action = currentStatus === 'active' ? 'suspend' : 'activate';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            const response = await adminAPI.updateUserStatus(userId, action);
            if (response.data.success) {
                setUsers(prev => prev.map(u =>
                    u._id === userId
                        ? { ...u, status: action === 'suspend' ? 'suspended' : 'active' }
                        : u
                ));
            }
        } catch (error) {
            console.error('Failed to update user status:', error);
            alert('Failed to update user status');
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-users-page">
            <div className="page-header">
                <div className="header-title">
                    <div className="header-icon">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1>User Management</h1>
                        <p>Manage platform users, roles, and account statuses</p>
                    </div>
                </div>
                <div className="header-actions">
                    <Button
                        variant="secondary"
                        onClick={fetchUsers}
                        isLoading={isRefreshing}
                    >
                        <RefreshCcw size={16} />
                        Refresh
                    </Button>
                </div>
            </div>

            <GlassCard variant="liquid" className="controls-card">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <span className="filter-label"><Filter size={16} /> Role:</span>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Roles</option>
                        <option value="client">Clients</option>
                        <option value="advocate">Advocates</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </GlassCard>

            {isLoading ? (
                <div className="loading-state">Loading users...</div>
            ) : (
                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty-row">No users found</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className="user-info-cell">
                                                <div className="user-avatar-small">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="user-contact">
                                                    <span className="user-name">{user.name}</span>
                                                    <span className="user-email">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge
                                                variant={user.role === 'admin' ? 'danger' : user.role === 'advocate' ? 'primary' : 'secondary'}
                                            >
                                                {user.role.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                <Calendar size={14} />
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <Badge
                                                variant={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'danger' : 'warning'}
                                            >
                                                {user.status}
                                            </Badge>
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleUpdateStatus(user._id, user.status)}
                                                    title={user.status === 'active' ? 'Suspend' : 'Activate'}
                                                >
                                                    {user.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                                                </Button>
                                                <Button variant="ghost" size="sm" title="View Details">
                                                    <MoreVertical size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
