import ProfileForm from '../components/auth/ProfileForm.jsx';

/**
 * Settings page component
 */
const SettingsPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">
                    Manage your account settings and preferences
                </p>
            </div>

            <ProfileForm />
        </div>
    );
};

export default SettingsPage;
