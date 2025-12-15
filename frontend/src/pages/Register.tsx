import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRegisterMutation } from '../services/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [register, { isLoading, error }] = useRegisterMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    const [validationErrors, setValidationErrors] = useState({
        name: '',
        email: '',
        password: '',
    });

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear validation error when user starts typing
        setValidationErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
    };

    // Client-side validation
    const validateForm = (): boolean => {
        const errors = {
            name: '',
            email: '',
            password: '',
        };
        let isValid = true;

        // Name validation
        if (formData.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
            isValid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
            isValid = false;
        }

        // Password validation
        if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        try {
            // Call register mutation
            const result = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            }).unwrap();

            // On success: dispatch credentials to Redux
            dispatch(
                setCredentials({
                    user: result.user,
                    token: result.jwtToken,
                })
            );

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (err) {
            // Error is handled by RTK Query and available in the error variable
            console.error('Registration failed:', err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-md">
                {/* Card Container */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                            Create Account
                        </h1>
                        <p className="text-gray-500">
                            Join us to track your crypto portfolio
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">
                                {'data' in error
                                    ? 'Registration failed'
                                    : 'An error occurred. Please try again.'}
                            </p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Input */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border ${validationErrors.name
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-indigo-500'
                                    } rounded-lg focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-200`}
                                placeholder="John Doe"
                                disabled={isLoading}
                            />
                            {validationErrors.name && (
                                <p className="mt-1 text-sm text-red-600">
                                    {validationErrors.name}
                                </p>
                            )}
                        </div>

                        {/* Email Input */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border ${validationErrors.email
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-indigo-500'
                                    } rounded-lg focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-200`}
                                placeholder="john@example.com"
                                disabled={isLoading}
                            />
                            {validationErrors.email && (
                                <p className="mt-1 text-sm text-red-600">
                                    {validationErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border ${validationErrors.password
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-indigo-500'
                                    } rounded-lg focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-200`}
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                            {validationErrors.password && (
                                <p className="mt-1 text-sm text-red-600">
                                    {validationErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Link to Login */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors duration-200"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;