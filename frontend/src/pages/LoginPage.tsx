import Login from '../components/Login';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const { isLoggedIn, login } = useAuth();
    const navigate = useNavigate();

    // If already logged in, redirect to home
    if (isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    const handleLoginSuccess = (username: string, isAdmin: boolean) => {
        login(username, isAdmin);
    };

    const handleCancel = () => {
        navigate('/');
    };

    return (
            <Login 
                onLoginSuccess={handleLoginSuccess}
                onCancel={handleCancel}
            />
    );
};

export default LoginPage;
