import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ component: Component, ...rest }) => {
    const location = useLocation();
    const { isLoggedIn } = useAuth();

    return isLoggedIn ? (
        <Component {...rest} />
    ) : (
        <Navigate to="/login" state={{ from: location }} replace />
    );
};

ProtectedRoute.propTypes = {
    component: PropTypes.elementType.isRequired,
};

export default ProtectedRoute;