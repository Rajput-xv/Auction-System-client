import { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
		const checkAuth = async () => {
			const token = document.cookie
				.split('; ')
				.find(row => row.startsWith('jwt='))?.split('=')[1];
			
			if (token) {
				try {
					const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
					const res = await axios.get(`${apiUrl}/api/users/me`, {
						withCredentials: true
					});
					setUser(res.data);
					setIsLoggedIn(true);
				} catch (err) {
					console.error('Token validation failed:', err);
					logout();
				}
			}
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