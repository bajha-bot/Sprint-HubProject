require("dotenv").config();
const express = require("express");
const cors = require("cors");
const myRoute = require("./route");

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5173', 'https://sprint-hub-coral.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'AppToken']
}));

app.options('/{*path}', cors());

app.use(express.json());

app.use("/api", myRoute);

module.exports = app;