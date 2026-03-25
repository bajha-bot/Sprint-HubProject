require("dotenv").config();
const express = require("express");
const cors = require("cors");
const myRoute = require("./route");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:5173', 'https://sprint-hub-coral.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'AppToken']
}));

app.use("/api", myRoute);

module.exports = app;