const axios = require('axios');
const { MAILHOG_URL } = require('../config');

async function purgeMailhog() {
  try {
    await axios.delete(`${MAILHOG_URL}/api/v1/messages`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return;
    }
    throw error;
  }
}

async function fetchMessages() {
  const { data } = await axios.get(`${MAILHOG_URL}/api/v2/messages`);
  return data.items || [];
}

async function waitForMail(predicate, { timeoutMs = 20000, intervalMs = 1000 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const items = await fetchMessages();
    const match = items.find(predicate);
    if (match) {
      return match;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error('MailHog message not found in allotted time');
}

module.exports = {
  purgeMailhog,
  fetchMessages,
  waitForMail,
};
