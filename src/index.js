const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const bodyParser = require("body-parser");
const path = require("path");
const functions = require("firebase-functions")
const port = 5002;
const app = express();

// app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.json({ limit: "200mb" }));
app.use(bodyParser.urlencoded({ limit: "200mb", extended: true }));
app.use(express.json());

const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));
// const getMessage = require("./src/Routes/getMessage");
const webhook = require("./controllers/webHook");

// app.use("/", getMessage);
app.use("/webhook", webhook);
// Menambahkan handler untuk root path
app.get("/", (req, res) => {
  res.send("Selamat datang di server Express!");
});
// app.listen(port, () => {
//   console.log(`Server berjalan di port: ${port}`);
// });

exports.apiForward = functions.https.onRequest(app)
