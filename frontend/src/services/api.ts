import axios, { AxiosError } from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    withCredentials: true, // allow cookies (JWT in cookies)
});


// --------------------
// Request Interceptor
// --------------------
api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError) => {
        // Now you have type-safe error handling
        if (error.response?.status === 401) {
            // Redirect to login
        }
        return Promise.reject(error);
    }
);

export default api;