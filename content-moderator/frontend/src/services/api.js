import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization header to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ----------------
// Moderation APIs
// ----------------

/**
 * Submit content for moderation
 * @param {Object} data - { content, content_type, context }
 * @returns {Promise} API response
 */
export const moderateContent = (data) => {
  return api.post('/moderation/moderate', data);
};

/**
 * Submit feedback on moderation decision
 * @param {string} contentId - ID of the moderated content
 * @param {Object} feedback - { should_flag, categories, comment }
 * @returns {Promise} API response
 */
export const submitFeedback = (contentId, feedback) => {
  return api.post(`/moderation/moderate/${contentId}/feedback`, feedback);
};

/**
 * Get moderation history
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise} API response
 */
export const getModerationHistory = (limit = 10) => {
  return api.get(`/moderation/history`, { params: { limit } });
};

// ----------------
// Preferences APIs
// ----------------

/**
 * Get user preferences
 * @returns {Promise} API response
 */
export const getUserPreferences = () => {
  return api.get('/users/preferences');
};

/**
 * Update user preferences
 * @param {Object} preferences - User preferences
 * @returns {Promise} API response
 */
export const updateUserPreferences = (preferences) => {
  return api.post('/users/preferences', preferences);
};

/**
 * Reset user preferences to default
 * @returns {Promise} API response
 */
export const resetUserPreferences = () => {
  return api.post('/users/preferences/reset');
};

// ----------------
// Feedback APIs
// ----------------

/**
 * Get feedback statistics
 * @returns {Promise} API response
 */
export const getFeedbackStats = () => {
  return api.get('/feedback/stats');
};

// ----------------
// Authentication APIs
// ----------------

/**
 * Login user
 * @param {Object} credentials - { username, password }
 * @returns {Promise} API response
 */
export const login = async (credentials) => {
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await axios.post(
    `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/token`,
    formData.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response;
};

export default api;