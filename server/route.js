const express = require("express");
const { getEmployees } = require("./employee");
const fs = require("fs");
const path = require("path");

const SHEET_IDS_FILE = path.join(__dirname, "sheetIds.json");

const readSheetIds = () => {
  try {
    return JSON.parse(fs.readFileSync(SHEET_IDS_FILE, "utf8"));
  } catch {
    return {};
  }
};

const writeSheetIds = (data) => {
  fs.writeFileSync(SHEET_IDS_FILE, JSON.stringify(data, null, 2));
  // keep a backup copy
  fs.writeFileSync(SHEET_IDS_FILE + '.backup', JSON.stringify(data, null, 2));
};

const router = express.Router();

router.get("/sheet-ids", (req, res) => {
  res.json(readSheetIds());
});

router.post("/sheet-ids", (req, res) => {
  const current = readSheetIds();
  writeSheetIds({ ...current, ...req.body });
  res.json({ success: true });
});

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