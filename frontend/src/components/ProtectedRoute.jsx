import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ component: Component, ...rest }) => {
    const location = useLocation();
    const { isLoggedIn, loading } = useAuth();
    
    // Show loading state while authentication status is being determined
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="w-16 h-16 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }
    
    // Redirect to login if not authenticated
    if (!isLoggedIn) {
        return (
            <Navigate 
                to="/login" 
                state={{ 
                    from: location,
                    message: "Please log in to access this page" 
                }} 
                replace 
            />
        );
    }
    
    // Render the protected component if authenticated
    return <Component {...rest} />;
};

ProtectedRoute.propTypes = {
    component: PropTypes.elementType.isRequired,
};

export default ProtectedRoute;
