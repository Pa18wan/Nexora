import { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon, Clock, MapPin,
    ChevronLeft, ChevronRight, Briefcase
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../../components/common';
import { casesAPI } from '../../services/api';
import './AdvocateCalendar.css';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: 'hearing' | 'filing' | 'deadline' | 'other';
    caseId: string;
    caseTitle: string;
    location?: string;
}

export function AdvocateCalendar() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const response = await casesAPI.getAll({ limit: 100 }); // Fetch enough cases
            if (response.data.success) {
                const cases = response.data.data.cases;
                const newEvents: CalendarEvent[] = [];

                cases.forEach((c: any) => {
                    // Normalize dates
                    if (c.nextHearingDate) {
                        newEvents.push({
                            id: `${c._id}-hearing`,
                            title: 'Court Hearing',
                            date: new Date(c.nextHearingDate),
                            type: 'hearing',
                            caseId: c._id,
                            caseTitle: c.title,
                            location: c.location?.city
                        });
                    }
                    if (c.filingDate) {
                        newEvents.push({
                            id: `${c._id}-filing`,
                            title: 'Case Filing',
                            date: new Date(c.filingDate),
                            type: 'filing',
                            caseId: c._id,
                            caseTitle: c.title
                        });
                    }
                    // Extract deadlines from AI analysis or description if possible?
                    // For now just standard dates
                });

                // Sort by date
                newEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
                setEvents(newEvents);
            }
        } catch (err) {
            console.error('Failed to fetch calendar events:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getMonthEvents = () => {
        return events.filter(e =>
            e.date.getMonth() === currentDate.getMonth() &&
            e.date.getFullYear() === currentDate.getFullYear()
        );
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const monthEvents = getMonthEvents();
    const today = new Date();

    return (
        <div className="calendar-page">
            <div className="page-header">
                <h1>Legal Calendar</h1>
                <div className="month-nav">
                    <Button variant="ghost" onClick={prevMonth}><ChevronLeft size={20} /></Button>
                    <h2>{currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
                    <Button variant="ghost" onClick={nextMonth}><ChevronRight size={20} /></Button>
                </div>
            </div>

            <div className="calendar-grid">
                {/* Upcoming List */}
                <div className="events-list">
                    {isLoading ? (
                        <div className="loading-text">Loading calendar...</div>
                    ) : monthEvents.length === 0 ? (
                        <GlassCard className="empty-state">
                            <CalendarIcon size={48} />
                            <p>No events scheduled for this month.</p>
                        </GlassCard>
                    ) : (
                        monthEvents.map(event => (
                            <GlassCard key={event.id} className={`event-card type-${event.type}`}>
                                <div className="event-date-box">
                                    <span className="day">{event.date.getDate()}</span>
                                    <span className="weekday">{event.date.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                                </div>
                                <div className="event-details">
                                    <div className="event-header">
                                        <h3>{event.title}</h3>
                                        <Badge variant={event.type === 'hearing' ? 'danger' : 'info'} size="sm">
                                            {event.type.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="case-info">
                                        <Briefcase size={14} />
                                        <span>{event.caseTitle}</span>
                                    </div>
                                    <div className="event-meta">
                                        <div className="meta-item">
                                            <Clock size={14} />
                                            <span>{event.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        {event.location && (
                                            <div className="meta-item">
                                                <MapPin size={14} />
                                                <span>{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>

                {/* Sidebar Summary */}
                <div className="calendar-sidebar">
                    <GlassCard className="summary-card">
                        <h3>Month Summary</h3>
                        <div className="summary-stats">
                            <div className="stat-item">
                                <span className="label">Hearings</span>
                                <span className="value">{monthEvents.filter(e => e.type === 'hearing').length}</span>
                            </div>
                            <div className="stat-item">
                                <span className="label">Filings</span>
                                <span className="value">{monthEvents.filter(e => e.type === 'filing').length}</span>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="upcoming-preview">
                        <h3>Upcoming Next Month</h3>
                        <div className="preview-list">
                            {events
                                .filter(e => e.date > new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0))
                                .slice(0, 3)
                                .map(e => (
                                    <div key={e.id} className="preview-item">
                                        <div className="preview-date">
                                            {e.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </div>
                                        <div className="preview-title">{e.title}</div>
                                    </div>
                                ))
                            }
                            {events.filter(e => e.date > new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)).length === 0 && (
                                <p className="no-upcoming">No upcoming events found.</p>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
