require("dotenv").config();
const express = require("express");
const cors = require("cors");
const myRoute = require("./route");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://sprint-hub-coral.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use("/api", myRoute);

module.exports = app;