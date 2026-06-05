import axios from 'axios';
import { getSession } from 'next-auth/react';

// Use a fixed API URL for debugging - change back to process.env.NEXT_PUBLIC_API_URL later
const API_URL = 'http://localhost:3001';
console.log('Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased timeout for better reliability
  withCredentials: true, // Keep this if your backend is configured for credentials
});

// Add request interceptor to handle request configuration and authentication
api.interceptors.request.use(
  async (config) => {
    // Get the session and add the token to the Authorization header
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    // You can add logging here for debugging
    // console.log(`Making ${config.method} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request configuration error:', error);
    return Promise.reject(error);
  }
);

// Improve the response error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error(
        'Request timeout - the server took too long to respond:',
        error
      );
    } else if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(
        `API Error (${error.response.status}): ${
          error.response.data?.message ||
          error.response.statusText ||
          'Unknown error'
        }`
      );

      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        // If we're in a browser environment, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin';
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network error - no response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Function to set the auth token in the headers
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Store token in localStorage for persistence across page refreshes
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  } else {
    delete api.defaults.headers.common['Authorization'];
    // Remove token from localStorage when logging out
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }
};

// Initialize token from localStorage on app startup
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('authToken');
  if (token) {
    setAuthToken(token);
  }
}

// Utility function for retrying failed requests
const retryRequest = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;

    console.log(`Retrying request... Attempts left: ${retries}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay);
  }
};

export const fetchCourses = async () => {
  try {
    // Use the retry mechanism for the request
    const response = await retryRequest(() => api.get('/courses'));
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    // Provide more user-friendly error for debugging
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        console.error(
          'Network error detected. Please check if your backend server is running at:',
          API_URL
        );
      }
    }
    throw error;
  }
};

export const fetchCourseById = async (id: string) => {
  try {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching course ${id}:`, error);
    throw error;
  }
};

export const fetchLessons = async (courseId: string) => {
  try {
    const response = await api.get(`/lessons?courseId=${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching lessons for course ${courseId}:`, error);
    throw error;
  }
};

export const fetchEnrollments = async (token: string) => {
  setAuthToken(token);
  try {
    const response = await api.get('/enrollments/my-courses');
    return response.data;
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    throw error;
  }
};

export const enrollInCourse = async (courseId: string, token: string) => {
  setAuthToken(token);
  try {
    const response = await api.post('/enrollments', { courseId });
    return response.data;
  } catch (error) {
    console.error(`Error enrolling in course ${courseId}:`, error);
    throw error;
  }
};

export const updateProgress = async (
  courseId: string,
  progress: number,
  token: string
) => {
  setAuthToken(token);
  try {
    const response = await api.put('/enrollments/progress', {
      courseId,
      progress,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating progress for course ${courseId}:`, error);
    throw error;
  }
};

export const unenrollFromCourse = async (courseId: string, token: string) => {
  setAuthToken(token);
  try {
    const response = await api.delete(`/enrollments/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error unenrolling from course ${courseId}:`, error);
    throw error;
  }
};

export const registerUser = async (userData: {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) => {
  try {
    console.log('Attempting to register user at:', API_URL + '/auth/register');
    const response = await api.post('/auth/register', userData);
    console.log('Registration successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);

    // Check if the server is running
    try {
      console.log('Testing backend connection...');
      await axios.get(API_URL + '/health', { timeout: 5000 });
      console.log('Backend is reachable');
    } catch (healthError) {
      console.error(
        'Backend server appears to be down or unreachable:',
        healthError
      );
    }

    throw error;
  }
};

export const checkEnrollmentStatus = async (courseId: string, token: string) => {
  setAuthToken(token);
  try {
    const response = await api.get(`/enrollments/${courseId}/status`);
    return response.data;
  } catch (error) {
    console.error(`Error checking enrollment status for course ${courseId}:`, error);
    throw error;
  }
};

export const getVideoProgress = async (lessonId: string, token: string) => {
  setAuthToken(token);
  try {
    const response = await api.get(`/progress/video/lesson/${lessonId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting video progress for lesson ${lessonId}:`, error);
    throw error;
  }
};

export const getCourseVideosProgress = async (courseId: string, token: string) => {
  setAuthToken(token);
  try {
    const response = await api.get(`/progress/video/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting course videos progress for course ${courseId}:`, error);
    throw error;
  }
};

export const updateVideoProgress = async (data: {
  lessonId: string;
  courseId: string;
  watchTime?: number;
  completed?: boolean;
}, token: string) => {
  setAuthToken(token);
  try {
    const response = await api.put('/progress/video', data);
    return response.data;
  } catch (error) {
    console.error(`Error updating video progress:`, error);
    throw error;
  }
};

export const requestStudyCoach = async (
  data: {
    prompt: string;
    intent?: string;
    courseId?: string;
    recentCourseIds?: string[];
  },
  token: string
) => {
  setAuthToken(token);
  try {
    const response = await api.post('/ai/study-coach', data);
    return response.data;
  } catch (error) {
    console.error('Error requesting AI study coach:', error);
    throw error;
  }
};

export default api;
