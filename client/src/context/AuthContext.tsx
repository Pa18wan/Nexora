import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Advocate } from '../types';
import api from '../services/api';

interface AuthContextType {
    user: User | null;
    advocateProfile: Advocate | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: 'client' | 'advocate';
    phone?: string;
    barCouncilId?: string;
    specialization?: string[];
    experienceYears?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [advocateProfile, setAdvocateProfile] = useState<Advocate | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    if (response.data.success) {
                        setUser(response.data.data.user);
                        setAdvocateProfile(response.data.data.advocateProfile);
                    }
                } catch (error) {
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, [token]);

    const login = async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.success) {
            const { user, advocateProfile, token } = response.data.data;
            setUser(user);
            setAdvocateProfile(advocateProfile);
            setToken(token);
            localStorage.setItem('token', token);
            return user;
        } else {
            throw new Error(response.data.message);
        }
    };

    const register = async (data: RegisterData) => {
        const response = await api.post('/auth/register', data);
        if (response.data.success) {
            const { user, token } = response.data.data;
            setUser(user);
            setToken(token);
            localStorage.setItem('token', token);
        } else {
            throw new Error(response.data.message);
        }
    };

    const logout = () => {
        setUser(null);
        setAdvocateProfile(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{
            user,
            advocateProfile,
            token,
            isLoading,
            isAuthenticated: !!user,
            login,
            register,
            logout,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
