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

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true); // Add loading state
    
    // Memoize the checkAuth function to prevent unnecessary recreations
    const checkAuth = useCallback(async () => {
        setLoading(true);
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('jwt='))
            ?.split('=')[1];
            
        if (token) {
            try {
                // Verify token validity by making a request to profile endpoint
                const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                const response = await fetch(`${apiUrl}/api/users/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    credentials: 'include' // Include cookies in the request
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                    setIsLoggedIn(true);
                } else {
                    // Token is invalid or expired
                    setIsLoggedIn(false);
                    setUser(null);
                    // Clear the cookie with proper attributes
                    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure;';
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsLoggedIn(false);
                setUser(null);
            }
        } else {
            setIsLoggedIn(false);
            setUser(null);
        }
        setLoading(false);
    }, []); // Empty dependency array as this doesn't depend on any props or state

    // Run auth check on component mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Login function with error handling
    const login = useCallback((userData) => {
        if (!userData) {
            console.error("Login failed: No user data provided");
            return;
        }
        setUser(userData);
        setIsLoggedIn(true);
    }, []);

    // Logout function with better error handling
    const logout = useCallback(async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
            const response = await fetch(`${apiUrl}/api/users/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn("Server logout failed, but proceeding with local logout");
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // Clear cookie regardless of server response
            document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure;';
            setUser(null);
            setIsLoggedIn(false);
        }
    }, []);

    // Provide a refreshAuth method to manually trigger auth check
    const refreshAuth = useCallback(() => {
        checkAuth();
    }, [checkAuth]);

    // Context value memoized to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        isLoggedIn, 
        user, 
        login, 
        logout,
        refreshAuth,
        loading
    }), [isLoggedIn, user, login, logout, refreshAuth, loading]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
