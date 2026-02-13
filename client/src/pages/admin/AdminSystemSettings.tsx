import { useState, useEffect } from 'react';
import {
    Settings, Save, RotateCcw, ToggleLeft, ToggleRight,
    AlertTriangle, CheckCircle
} from 'lucide-react';
import { GlassCard, Button } from '../../components/common';
import { adminAPI } from '../../services/api';
import './AdminSettings.css';

interface SystemSetting {
    _id: string;
    key: string;
    value: string;
    description: string;
    type: 'string' | 'boolean' | 'number';
    updatedAt: string;
}

export function AdminSettings() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await adminAPI.getSettings();
            if (response.data.success) {
                setSettings(response.data.data.settings || []);
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Failed to load system settings' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (id: string, newValue: string) => {
        setSettings(prev => prev.map(s =>
            s._id === id ? { ...s, value: newValue } : s
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const updates = settings.map(({ key, value }) => ({ key, value }));
            await adminAPI.updateSettings(updates);
            setMessage({ type: 'success', text: 'Settings updated successfully' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="loading-state">Loading settings...</div>;

    return (
        <div className="admin-settings-page">
            <div className="page-header">
                <div>
                    <h1>System Configuration</h1>
                    <p>Manage global platform settings and feature flags</p>
                </div>
                <Button onClick={handleSave} isLoading={isSaving}>
                    <Save size={18} />
                    Save Changes
                </Button>
            </div>

            {message && (
                <div className={`message-banner ${message.type}`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    {message.text}
                </div>
            )}

            <div className="settings-list">
                {settings.map(setting => (
                    <GlassCard key={setting._id} className="setting-card">
                        <div className="setting-info">
                            <h3>{setting.key.replace(/_/g, ' ').toUpperCase()}</h3>
                            <p>{setting.description}</p>
                            <span className="setting-type">Type: {setting.type}</span>
                        </div>
                        <div className="setting-control">
                            {setting.type === 'boolean' ? (
                                <button
                                    className={`toggle-btn ${setting.value === 'true' ? 'on' : 'off'}`}
                                    onClick={() => handleChange(setting._id, setting.value === 'true' ? 'false' : 'true')}
                                >
                                    {setting.value === 'true' ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    <span>{setting.value === 'true' ? 'Enabled' : 'Disabled'}</span>
                                </button>
                            ) : (
                                <input
                                    type={setting.type === 'number' ? 'number' : 'text'}
                                    value={setting.value}
                                    onChange={(e) => handleChange(setting._id, e.target.value)}
                                    className="setting-input"
                                />
                            )}
                        </div>
                    </GlassCard>
                ))}

                {settings.length === 0 && (
                    <div className="empty-state">
                        <Settings size={48} />
                        <p>No system settings found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
