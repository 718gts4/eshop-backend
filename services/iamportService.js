const axios = require('axios');

// Iamport API credentials
const IAMPORT_API_KEY = process.env.IAMPORT_API_KEY;
const IAMPORT_API_SECRET = process.env.IAMPORT_API_SECRET;

// Function to retrieve access token from Iamport
async function getIamportToken() {
  const response = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: IAMPORT_API_KEY,
    imp_secret: IAMPORT_API_SECRET,
  });
  return response.data.response.access_token;
}

// Function to verify the payment with Iamport
exports.verifyPayment = async (imp_uid) => {
  const token = await getIamportToken();
  const response = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.response; // Return the payment details
};
