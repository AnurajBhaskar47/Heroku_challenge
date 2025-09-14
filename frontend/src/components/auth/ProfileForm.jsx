import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Card, { CardHeader, CardTitle, CardBody } from '../common/Card.jsx';
import { getErrorMessage } from '../../services/api.js';
import { ACADEMIC_YEARS, COMMON_MAJORS, TIMEZONES, VALIDATION } from '../../utils/constants.js';
import { authService } from '../../services/auth.js';

/**
 * Profile form component for updating user profile
 */
const ProfileForm = () => {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        year_of_study: '',
        major: '',
        timezone: 'America/New_York',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Password change form
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                year_of_study: user.year_of_study ?? '',
                major: user.major || '',
                timezone: user.timezone || 'America/New_York',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Clear success message on change
        if (successMessage) {
            setSuccessMessage('');
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));

        // Clear field error when user starts typing
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePasswordForm = () => {
        const newErrors = {};

        if (!passwordData.old_password) {
            newErrors.old_password = 'Current password is required';
        }

        if (!passwordData.new_password) {
            newErrors.new_password = 'New password is required';
        } else if (passwordData.new_password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
            newErrors.new_password = `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`;
        }

        if (!passwordData.confirm_password) {
            newErrors.confirm_password = 'Please confirm your new password';
        } else if (passwordData.new_password !== passwordData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
        }

        setPasswordErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Clean up form data for backend
            const cleanedData = {
                ...formData,
                // Convert empty string to null for year_of_study (IntegerField)
                year_of_study: formData.year_of_study === '' || formData.year_of_study === null ? null : Number(formData.year_of_study)
            };

            const result = await updateProfile(cleanedData);

            if (result.success) {
                setSuccessMessage('Profile updated successfully!');
                setErrors({});
            } else {
                setErrors({ general: result.error });
            }
        } catch (error) {
            setErrors({ general: getErrorMessage(error) });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (!validatePasswordForm()) {
            return;
        }

        setIsChangingPassword(true);

        try {
            // Note: This would need to be implemented in the auth service
            // For now, we'll show a placeholder message
            await authService.changePassword({
                old_password: passwordData.old_password,
                new_password: passwordData.new_password,
            });
        } catch (error) {
            setPasswordErrors({ general: getErrorMessage(error) });
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (!user) {
        return (
            <Card>
                <CardBody>
                    <p className="text-gray-500">Loading profile...</p>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                        Update your personal information and academic details.
                    </p>
                </CardHeader>

                <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-600">{errors.general}</p>
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                <p className="text-sm text-green-600">{successMessage}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                            />
                        </div>

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
                        />

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                        </div>

                        <Select
                            label="Timezone"
                            name="timezone"
                            value={formData.timezone}
                            onChange={handleChange}
                            options={TIMEZONES}
                            fullWidth
                            helperText="Used for scheduling and reminders"
                        />

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                Update Profile
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>

            {/* Password Change */}
            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                        Update your password to keep your account secure.
                    </p>
                </CardHeader>

                <CardBody>
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        {passwordErrors.general && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-600">{passwordErrors.general}</p>
                            </div>
                        )}

                        <Input
                            label="Current Password"
                            name="old_password"
                            type="password"
                            value={passwordData.old_password}
                            onChange={handlePasswordChange}
                            error={passwordErrors.old_password}
                            required
                            fullWidth
                            autoComplete="current-password"
                        />

                        <Input
                            label="New Password"
                            name="new_password"
                            type="password"
                            value={passwordData.new_password}
                            onChange={handlePasswordChange}
                            error={passwordErrors.new_password}
                            required
                            fullWidth
                            autoComplete="new-password"
                            helperText={`Minimum ${VALIDATION.MIN_PASSWORD_LENGTH} characters`}
                        />

                        <Input
                            label="Confirm New Password"
                            name="confirm_password"
                            type="password"
                            value={passwordData.confirm_password}
                            onChange={handlePasswordChange}
                            error={passwordErrors.confirm_password}
                            required
                            fullWidth
                            autoComplete="new-password"
                        />

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                variant="secondary"
                                loading={isChangingPassword}
                                disabled={isChangingPassword}
                            >
                                Change Password
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>

            {/* Account Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardBody>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Username</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Member since</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                            </dd>
                        </div>
                    </dl>
                </CardBody>
            </Card>
        </div>
    );
};

export default ProfileForm;
