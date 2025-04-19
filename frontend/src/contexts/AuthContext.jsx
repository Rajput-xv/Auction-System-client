<<<<<<< HEAD
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

// Create the context
const AuthContext = createContext(null);

// Create a custom hook for using the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
=======
import { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();
>>>>>>> parent of a6d6d02 (new update)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('jwt='))?.split('=')[1];
            setIsLoggedIn(!!token);
        };
        checkAuth();
    }, []);

    const login = (userData) => {
        setUser(userData);
        setIsLoggedIn(true);
    };

    const logout = () => {
        document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        setUser(null);
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);