const express = require("express");
const { getEmployees } = require("./employee");


const router = express.Router();

router.get("/employees", async (req, res) => {
  try {
    const data = await getEmployees();

    res.json({ data, success: true });
  } catch (error) {
    console.error("Route Error:", error);

    res.status(500).json({
      message: "Failed to sync employees",
      error: error.response?.data || error.message
    });
  }
});
module.exports = router;