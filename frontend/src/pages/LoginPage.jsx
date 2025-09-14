import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm.jsx';

/**
 * Login page component
 */
const LoginPage = () => {
    const navigate = useNavigate();

    const handleLoginSuccess = () => {
        navigate('/dashboard');
    };

    return <LoginForm onSuccess={handleLoginSuccess} />;
};

export default LoginPage;
