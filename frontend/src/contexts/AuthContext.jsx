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
                    // Verify token validity by making a request to profile endpoint
                    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                    const response = await fetch(`${apiUrl}/api/users/profile`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                        setIsLoggedIn(true);
                    } else {
                        // Token is invalid or expired
                        setIsLoggedIn(false);
                        document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    }
                } catch (error) {
                    console.error("Auth check failed:", error);
                    setIsLoggedIn(false);
                }
            } else {
                setIsLoggedIn(false);
            }
        };
        
        checkAuth();
    }, []);

    const login = (userData) => {
        setUser(userData);
        setIsLoggedIn(true);
    };

    const logout = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
            await fetch(`${apiUrl}/api/users/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error("Logout error:", error);
        }
        
        // Clear cookie regardless of server response
        document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure;';
        setUser(null);
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
