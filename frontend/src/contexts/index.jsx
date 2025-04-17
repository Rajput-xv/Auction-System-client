import { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext({
    isLoggedIn: false,
    login: () => {},
    logout: () => {},
});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const login = () => {
        setIsLoggedIn(true);
    };

    const logout = () => {
        setIsLoggedIn(false);
    };

    useEffect(() => {
        const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("jwt="))
            ?.split("=")[1];
        if (token) {
            login();
        } else {
            logout();
        }
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};