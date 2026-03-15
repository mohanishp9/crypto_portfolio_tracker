import { useGetCurrentUserQuery } from "../services/authApi";

const Profile = () => {
    const { data, isLoading, error } = useGetCurrentUserQuery();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading profile...
            </div>
        );
    }

    if (error) {
        return <div>Error loading profile</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-xl mx-auto bg-white shadow rounded-xl p-8">
                <h1 className="text-2xl font-semibold mb-6">User Profile</h1>

                <div className="space-y-4">
                    <div className="flex justify-between">
                        <span>Name</span>
                        <span>{data?.user.name}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Email</span>
                        <span>{data?.user.email}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>User ID</span>
                        <span className="font-mono">{data?.user._id}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;