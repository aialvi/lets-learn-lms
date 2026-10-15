import axios from 'axios';

interface CourseResponse {
  id: number;
  title: string;
  description: string | null;
  author: {
    id: number;
    username: string;
  };
  lessons: {
    id: number;
    title: string;
    order: number;
  }[];
  _count: {
    lessons: number;
    enrollments: number;
  };
}

interface EnrollmentResponse {
  id: number;
  userId: number;
  courseId: number;
  createdAt: string;
}

interface RegisterUserRequest {
  username: string;
  email: string;
  password: string;
}

interface RegisterUserResponse {
  id: number;
  username: string;
  email: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => config,
  (error) => {
    console.error('Request configuration error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - the server took too long to respond:', error);
    } else if (error.response) {
      console.error(
        `API Error (${error.response.status}): ${
          error.response.data?.message || error.response.statusText || 'Unknown error'
        }`
      );
    } else if (error.request) {
      console.error('Network error - no response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Set auth token for requests
const setAuthToken = (token: string | null): void => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Retry functionality for failed requests
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error) {
    if (maxRetries <= 0) throw error;
    console.log(`Retrying request... Attempts left: ${maxRetries}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(requestFn, maxRetries - 1, delay);
  }
};

// API endpoints
export const fetchCourses = async (): Promise<CourseResponse[]> => {
  try {
    const response = await retryRequest(() => apiClient.get('/courses'));
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    if (axios.isAxiosError(error) && !error.response) {
      console.error('Network error detected. Please check if your backend server is running at:', API_URL);
    }
    throw error;
  }
};

export const enrollInCourse = async (courseId: number, token: string): Promise<EnrollmentResponse> => {
  setAuthToken(token);
  try {
    const response = await apiClient.post('/enrollments', { courseId });
    return response.data;
  } catch (error) {
    console.error(`Error enrolling in course ${courseId}:`, error);
    throw error;
  }
};

export const registerUser = async (userData: RegisterUserRequest): Promise<RegisterUserResponse> => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export default apiClient;
