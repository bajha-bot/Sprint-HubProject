const express = require("express");
const { getEmployees } = require("./employee");
const fs = require("fs");
const path = require("path");

const SHEET_IDS_FILE = path.join(__dirname, "sheetIds.json");

const readSheetIds = () => {
  try {
    const raw = JSON.parse(fs.readFileSync(SHEET_IDS_FILE, "utf8"));
    // parse any double-stringified values
    const result = {};
    for (const [key, value] of Object.entries(raw)) {
      try { result[key] = JSON.parse(value); } catch { result[key] = value; }
    }
    return result;
  } catch {
    return {};
  }
};

const writeSheetIds = (data) => {
  // store values as-is (no double stringify)
  fs.writeFileSync(SHEET_IDS_FILE, JSON.stringify(data, null, 2));
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

router.get("/storage/:key", (req, res) => {
  const data = readSheetIds();
  const value = data[req.params.key] ?? null;
  res.json({ data: value });
});

router.put("/storage/:key", (req, res) => {
  const current = readSheetIds();
  current[req.params.key] = req.body;
  writeSheetIds(current);
  res.json({ success: true });
});

router.get("/admin-emails", (req, res) => {
  const data = readSheetIds();
  res.json({ adminEmails: data.sprintHub_admin_emails || [] });
});

router.post("/admin-emails", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const current = readSheetIds();
  const list = current.sprintHub_admin_emails || [];
  if (!list.includes(email)) list.push(email);
  current.sprintHub_admin_emails = list;
  writeSheetIds(current);
  res.json({ success: true, adminEmails: list });
});

router.delete("/admin-emails", (req, res) => {
  const { email } = req.body;
  const current = readSheetIds();
  current.sprintHub_admin_emails = (current.sprintHub_admin_emails || []).filter(e => e !== email);
  writeSheetIds(current);
  res.json({ success: true, adminEmails: current.sprintHub_admin_emails });
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