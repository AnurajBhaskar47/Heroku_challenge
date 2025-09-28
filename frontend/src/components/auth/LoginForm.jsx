import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import StudyOwlIcon from '../common/StudyOwlIcon.jsx';
import { getErrorMessage } from '../../services/api.js';

/**
 * Login form component
 */
const LoginForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, error: authError } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await login(formData);

            if (result.success) {
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                setErrors({ general: result.error });
            }
        } catch (error) {
            setErrors({ general: getErrorMessage(error) });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center">
                        <StudyOwlIcon className="w-12 h-12" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                        Welcome to Study Bud
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to your account to continue learning
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {(errors.general || authError) && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-600">
                                {errors.general || authError}
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Input
                            label="Username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            error={errors.username}
                            required
                            fullWidth
                            autoComplete="username"
                            placeholder="Enter your username"
                        />

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                            required
                            fullWidth
                            autoComplete="current-password"
                            placeholder="Enter your password"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link
                                to="/register"
                                className="font-medium text-primary-600 hover:text-primary-500"
                            >
                                Don&apos;t have an account? Sign up
                            </Link>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        fullWidth
                        size="lg"
                    >
                        Sign In
                    </Button>
                </form>

                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        By signing in, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
