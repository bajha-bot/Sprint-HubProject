const axios = require("axios");
const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false
});

const AppToken = process.env.MYTEAM_APP_TOKEN;

async function getEmployees() {

  try {
    const response = await axios.get(process.env.MYTEAM_API_URL, {
      headers: { AppToken },
      httpsAgent: agent
    }
    );

    const api = response.data;
    return api;

  } catch (error) {
    throw error;
  }
}

module.exports = {
  getEmployees
};