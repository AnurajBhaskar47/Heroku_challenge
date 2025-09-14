import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm.jsx';

/**
 * Registration page component
 */
const RegisterPage = () => {
    const navigate = useNavigate();

    const handleRegisterSuccess = () => {
        navigate('/dashboard');
    };

    return <RegisterForm onSuccess={handleRegisterSuccess} />;
};

export default RegisterPage;
