import { useState, useEffect } from 'react';
import {
    FileText, Download, Trash2, Search, Filter,
    Calendar, Briefcase, File, ExternalLink, ChevronRight
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { documentsAPI } from '../../services/api';
import './MyDocuments.css';

interface Document {
    _id: string;
    originalName: string;
    mimeType: string;
    size: number;
    caseId: {
        _id: string;
        title: string;
    } | null;
    category: string;
    type: string;
    createdAt: string;
}

export function MyDocuments() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const response = await documentsAPI.listAll();
            if (response.data.success) {
                setDocuments(response.data.data.documents || []);
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async (docId: string, filename: string) => {
        try {
            const response = await documentsAPI.download(docId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download document');
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('pdf')) return <FileText className="icon-pdf" size={24} />;
        if (mimeType.includes('image')) return <FileText className="icon-image" size={24} />;
        if (mimeType.includes('word') || mimeType.includes('officedocument')) return <FileText className="icon-doc" size={24} />;
        return <File size={24} />;
    };

    const filteredDocuments = documents.filter(doc =>
        doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.caseId?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="my-documents-page">
            <div className="page-header">
                <div className="header-title">
                    <div className="header-icon">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h1>My Documents</h1>
                        <p>Access and manage all your case-related legal documents</p>
                    </div>
                </div>
            </div>

            <GlassCard variant="liquid" className="controls-card">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search documents or cases..."
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
                        <option value="legal">Legal Papers</option>
                        <option value="id">Identity Proof</option>
                        <option value="evidence">Evidence</option>
                    </select>
                </div>
            </GlassCard>

            {isLoading ? (
                <div className="loading-state">Loading your documents...</div>
            ) : filteredDocuments.length === 0 ? (
                <GlassCard variant="liquid" className="empty-state">
                    <FileText size={48} />
                    <h3>No documents found</h3>
                    <p>Start by uploading documents to your cases.</p>
                </GlassCard>
            ) : (
                <div className="documents-grid">
                    {filteredDocuments.map((doc) => (
                        <GlassCard key={doc._id} variant="liquid" className="document-card" hover>
                            <div className="document-preview">
                                {getFileIcon(doc.mimeType)}
                                <div className="doc-category">
                                    <Badge variant="info" size="sm">{doc.category || 'Legal'}</Badge>
                                </div>
                            </div>

                            <div className="document-info">
                                <h3 title={doc.originalName}>{doc.originalName}</h3>
                                <div className="doc-meta">
                                    <span className="doc-size">{formatSize(doc.size)}</span>
                                    <span className="doc-dot">•</span>
                                    <span className="doc-date">
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {doc.caseId && (
                                    <div className="doc-case">
                                        <Briefcase size={12} />
                                        <span title={doc.caseId.title}>{doc.caseId.title}</span>
                                    </div>
                                )}
                            </div>

                            <div className="document-actions">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="action-btn"
                                    onClick={() => handleDownload(doc._id, doc.originalName)}
                                >
                                    <Download size={18} />
                                </Button>
                                <Button variant="ghost" size="sm" className="action-btn">
                                    <ExternalLink size={18} />
                                </Button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
