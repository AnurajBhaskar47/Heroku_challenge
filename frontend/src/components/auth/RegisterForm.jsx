import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import StudyOwlIcon from '../common/StudyOwlIcon.jsx';
import Select from '../common/Select.jsx';
import { getErrorMessage } from '../../services/api.js';
import { ACADEMIC_YEARS, COMMON_MAJORS, TIMEZONES, VALIDATION } from '../../utils/constants.js';

/**
 * Registration form component
 */
const RegisterForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        year_of_study: '',
        major: '',
        timezone: 'America/New_York',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, error: authError } = useAuth();

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

        // Required fields
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
            newErrors.password = `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`;
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
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
            // Map confirmPassword to password_confirm for backend and clean data
            const { confirmPassword, ...submitData } = formData;
            submitData.password_confirm = confirmPassword;

            // Convert empty string to null for year_of_study (IntegerField)
            if (submitData.year_of_study === '' || submitData.year_of_study === null) {
                submitData.year_of_study = null;
            } else {
                submitData.year_of_study = Number(submitData.year_of_study);
            }

            const result = await register(submitData);

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
                        Join Study Bud
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Create your account to start your learning journey
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
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                name="first_name"
                                type="text"
                                value={formData.first_name}
                                onChange={handleChange}
                                error={errors.first_name}
                                required
                                fullWidth
                                autoComplete="given-name"
                                placeholder="John"
                            />

                            <Input
                                label="Last Name"
                                name="last_name"
                                type="text"
                                value={formData.last_name}
                                onChange={handleChange}
                                error={errors.last_name}
                                required
                                fullWidth
                                autoComplete="family-name"
                                placeholder="Doe"
                            />
                        </div>

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
                            placeholder="johndoe"
                            helperText="Choose a unique username (minimum 3 characters)"
                        />

                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            required
                            fullWidth
                            autoComplete="email"
                            placeholder="john@example.com"
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
                            autoComplete="new-password"
                            placeholder="Enter a secure password"
                            helperText={`Minimum ${VALIDATION.MIN_PASSWORD_LENGTH} characters`}
                        />

                        <Input
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={errors.confirmPassword}
                            required
                            fullWidth
                            autoComplete="new-password"
                            placeholder="Confirm your password"
                        />

                        {/* Academic Info */}
                        <div className="border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                                Academic Information (Optional)
                            </h4>

                            <div className="space-y-4">
                                <Select
                                    label="Year of Study"
                                    name="year_of_study"
                                    value={formData.year_of_study}
                                    onChange={handleChange}
                                    options={ACADEMIC_YEARS}
                                    fullWidth
                                    placeholder="Select your year"
                                />

                                <Select
                                    label="Major"
                                    name="major"
                                    value={formData.major}
                                    onChange={handleChange}
                                    fullWidth
                                    placeholder="Select your major"
                                >
                                    {COMMON_MAJORS.map((major) => (
                                        <option key={major} value={major}>
                                            {major}
                                        </option>
                                    ))}
                                </Select>

                                <Select
                                    label="Timezone"
                                    name="timezone"
                                    value={formData.timezone}
                                    onChange={handleChange}
                                    options={TIMEZONES}
                                    fullWidth
                                    helperText="Used for scheduling and reminders"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link
                                to="/login"
                                className="font-medium text-primary-600 hover:text-primary-500"
                            >
                                Already have an account? Sign in
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
                        Create Account
                    </Button>
                </form>

                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;
