const axios = require('axios');
const https = require('https');
const crypto = require('crypto');

const agent = new https.Agent({ rejectUnauthorized: false });

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 60; // 2 months (60 days)

const base64url = (input) => Buffer.from(input).toString('base64url');

// Sign our own MyTeam AppToken (HS256), mirroring MyTeam's Java jjwt example
const generateToken = () => {
  const secret = process.env.MYTEAM_SECRET_KEY;
  if (!secret) throw new Error('MYTEAM_SECRET_KEY is not set in server/.env');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TOKEN_TTL_SECONDS;
  const header = base64url(JSON.stringify({ alg: 'HS256' }));
  const payload = base64url(JSON.stringify({
    sub: 'nisum-university-app',
    consumerId: 'nisum-university',
    iat: now,
    exp,
  }));
  const signature = crypto
    .createHmac('sha256', Buffer.from(secret, 'base64'))
    .update(`${header}.${payload}`)
    .digest('base64url');
  return { token: `${header}.${payload}.${signature}`, expiry: exp * 1000 };
};

let cachedToken = null;

// Reuse the token until 5 minutes before expiry, then sign a fresh one
const getValidToken = () => {
  if (!cachedToken || Date.now() >= cachedToken.expiry - 300000) {
    cachedToken = generateToken();
  }
  return cachedToken.token;
};

async function getEmployees() {
  const token = getValidToken();
  if (!process.env.MYTEAM_API_URL || process.env.MYTEAM_API_URL === '<your_api_url_here>') {
    throw new Error('MYTEAM_API_URL is not set in server/.env');
  }
  const response = await axios.get(process.env.MYTEAM_API_URL, {
    headers: { AppToken: token },
    httpsAgent: agent,
  });
  return response.data;
}

module.exports = { getEmployees };
