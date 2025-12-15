import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLoginMutation } from '../services/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
const Login = () => {
    const [login, { isLoading, error }] = useLoginMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [validationErrors, setValidationErrors] = useState({
        email: '',
        password: '',
    });

    // Handel Input Changes
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
        }))
    };

    // Client-side validation
    const validateForm = (): boolean => {
        const errors = {
            email: '',
            password: '',
        };
        let isValid = true;

        // Email validation
        if (!formData.email.trim()) {
            errors.email = 'Please enter the email';
            isValid = false;
        }

        // Password validation
        if (!formData.password.trim()) {
            errors.password = 'Please enter the password';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            // Call login mutation
            const result = await login({
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
            console.error('Login failed:', err);
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
                            Login
                        </h1>
                        <p className="text-gray-500">
                            Login to your account
                        </p>
                    </div>
                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">
                                {'data' in error
                                    ? 'Login failed'
                                    : 'An error occurred. Please try again.'}
                            </p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className='space-y-6'>
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                    {/* Link to Register */}
                    <div className='mt-6 text-center'>
                        <p className='text-gray-500 text-sm'>
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className='text-indigo-600 hover:text-indigo-500'>
                                Register
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;