const axios = require('axios');

const fetchApiData = async ({ url, method = 'post', headers = {}, params = {}, data = {}, timeout = 10000 }) => {
  try {
    const response = await axios({ url, method, headers, params, data, timeout });
    return response.data;
  } catch (error) {
    console.error(`API error on ${method.toUpperCase()} ${url}:`, error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
    };
  }
};

module.exports = fetchApiData;
