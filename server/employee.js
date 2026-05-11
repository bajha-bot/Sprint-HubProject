const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

const agent = new https.Agent({ rejectUnauthorized: false });

const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.exp * 1000;
  } catch { return 0; }
};

// Read token directly from .env file (not process.env) so changes apply without restart
const readTokenFromEnvFile = () => {
  try {
    const envPath = path.join(__dirname, '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const line = content.split('\n').find(l => l.startsWith('MYTEAM_APP_TOKEN='));
    return line ? line.split('=').slice(1).join('=').trim() : null;
  } catch { return null; }
};

const getValidToken = () => {
  // First try process.env (set at startup)
  let token = process.env.MYTEAM_APP_TOKEN;
  let expiry = getTokenExpiry(token);

  // If expired, re-read directly from .env file
  if (Date.now() >= expiry - 300000) {
    const fileToken = readTokenFromEnvFile();
    if (fileToken) {
      const fileExpiry = getTokenExpiry(fileToken);
      if (fileExpiry > Date.now()) {
        process.env.MYTEAM_APP_TOKEN = fileToken; // update in-memory too
        console.log('Token reloaded from .env file, expires:', new Date(fileExpiry).toISOString());
        return fileToken;
      }
    }
    console.error('Token expired. Update MYTEAM_APP_TOKEN in server/.env (no restart needed).');
  }

  return token;
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
