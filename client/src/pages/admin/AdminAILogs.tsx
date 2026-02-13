import { useState, useEffect } from 'react';
import {
    Brain, Search, Filter, Calendar, Zap,
    MessageSquare, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { aiAPI } from '../../services/api';
import './AdminAILogs.css';

interface AILog {
    _id: string;
    userId: {
        name: string;
        email: string;
    } | null;
    type: string;
    input: any;
    output: any;
    tokensUsed?: {
        total: number;
    };
    latencyMs?: number;
    status: string;
    createdAt: string;
}

export function AdminAILogs() {
    const [logs, setLogs] = useState<AILog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [filterType]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (filterType !== 'all') params.type = filterType;

            const response = await aiAPI.getLogs(params);
            if (response.data.success) {
                setLogs(response.data.data.logs || []);
            }
        } catch (error) {
            console.error('Failed to fetch AI logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'classification': return <Filter size={18} className="icon-blue" />;
            case 'urgency': return <AlertCircle size={18} className="icon-warning" />;
            case 'matching': return <Zap size={18} className="icon-purple" />;
            case 'chat': return <MessageSquare size={18} className="icon-cyan" />;
            default: return <Brain size={18} />;
        }
    };

    const filteredLogs = logs.filter(log =>
        log.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof log.input === 'string' && log.input.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="admin-ai-logs-page">
            <div className="page-header">
                <div className="header-title">
                    <div className="header-icon">
                        <Brain size={24} />
                    </div>
                    <div>
                        <h1>AI Usage Logs</h1>
                        <p>Monitor AI interactions, token usage, and response performance</p>
                    </div>
                </div>
                <div className="header-actions">
                    <Button variant="secondary" onClick={fetchLogs}>
                        <Clock size={16} />
                        Refresh Logs
                    </Button>
                </div>
            </div>

            <GlassCard variant="liquid" className="controls-card">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search logs by user or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Types</option>
                        <option value="classification">Classification</option>
                        <option value="urgency">Urgency</option>
                        <option value="matching">Matching</option>
                        <option value="chat">Chat</option>
                    </select>
                </div>
            </GlassCard>

            {isLoading ? (
                <div className="loading-state">Loading AI logs...</div>
            ) : filteredLogs.length === 0 ? (
                <GlassCard variant="liquid" className="empty-state">
                    <h3>No logs found</h3>
                    <p>AI interaction records will appear here.</p>
                </GlassCard>
            ) : (
                <div className="logs-grid">
                    {filteredLogs.map((log) => (
                        <GlassCard key={log._id} variant="liquid" className="log-card">
                            <div className="log-header">
                                <div className="log-info">
                                    <div className="log-type">
                                        {getTypeIcon(log.type)}
                                        <span>{log.type.toUpperCase()}</span>
                                    </div>
                                    <div className="log-user">
                                        <Badge variant="secondary">
                                            {log.userId?.name || 'Anonymous'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="log-time">
                                    <Calendar size={14} />
                                    {new Date(log.createdAt).toLocaleString()}
                                </div>
                            </div>

                            <div className="log-content">
                                <div className="log-section">
                                    <label>Prompt / Input</label>
                                    <div className="content-box code-font">
                                        {typeof log.input === 'string'
                                            ? (log.input.length > 200 ? log.input.substring(0, 200) + '...' : log.input)
                                            : JSON.stringify(log.input).substring(0, 200) + '...'}
                                    </div>
                                </div>

                                <div className="log-section">
                                    <label>AI Response</label>
                                    <div className="content-box response-box">
                                        {typeof log.output === 'string'
                                            ? (log.output.length > 200 ? log.output.substring(0, 200) + '...' : log.output)
                                            : JSON.stringify(log.output).substring(0, 200) + '...'}
                                    </div>
                                </div>
                            </div>

                            <div className="log-footer">
                                <div className="log-stat">
                                    <Zap size={14} />
                                    <span>{log.tokensUsed?.total || 0} tokens</span>
                                </div>
                                <div className="log-stat">
                                    <Clock size={14} />
                                    <span>{log.latencyMs || 0}ms</span>
                                </div>
                                <div className="log-status">
                                    <CheckCircle size={14} className={`icon-${log.status === 'success' ? 'success' : 'danger'}`} />
                                    <span>{log.status.toUpperCase()}</span>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
