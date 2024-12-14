const express = require("express");
const router = express.Router();
const moment = require("moment-timezone");

const {
  sendMessageTele,
  sendTelegramMessage,
  saveBase64File,
} = require("../functions/Utils");

let webhookQueue = []; // Antrian utama
let skippedQueue = []; // Antrian untuk data yang gagal diproses
let isProcessing = false; // Flag untuk melacak proses

// Fungsi delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fungsi untuk memproses antrian
const processQueue = async () => {
  if (isProcessing) return;
  isProcessing = true;

  while (webhookQueue.length > 0) {
    const currentData = webhookQueue.shift(); // Ambil data pertama di antrian
    try {
      await processWebhook(currentData); // Proses data
    } catch (error) {
      console.error(
        "Gagal memproses data, menambahkan ke antrian skip:",
        error
      );
      skippedQueue.push(currentData); // Tambahkan ke antrian skip jika gagal
    }
    await delay(2000); // Tambahkan delay
  }

  // Proses antrian skip jika antrian utama selesai
  if (skippedQueue.length > 0) {
    console.log("Memproses antrian skip...");
    await processSkippedQueue();
  }

  isProcessing = false; // Reset flag
};

// Fungsi untuk memproses webhook
const processWebhook = async (data) => {
  const webhookData = data.results;
  let type = data.type;
  let message = "";

  // Tentukan jenis pesan
  if (type === "message") {
    type = "chat";
    message = webhookData.message.conversation || "";
  } else if (webhookData.message.imageMessage) {
    type = "image";
    message = webhookData.message.imageMessage.caption || "";
  } else {
    type = "sticker";
  }

  if (!message) {
    console.warn("Pesan kosong, lanjut ke antrian berikutnya.");
    return;
  }

  console.log(`Memproses ${type}: ${message}`);
  try {
    const contact = webhookData.from.match(/\d+/g).join("");
    const sender = webhookData.pushname || "Tidak Diketahui";
    const fromMe = webhookData.fromMe;
    const text = fromMe
      ? `<b>Chat Dokter</b>\n\n${message}`
      : `<b>Chat Pasien</b>\n\n<b>Nama Pasien</b>: ${sender}\n<b>No Wa Pasien</b>: ${contact}\n\n${message}`;

    // Kirim pesan ke Telegram
    await sendMessageTele(
      text,
      "-1002437106789",
      "6823587684:AAE4Ya6Lpwbfw8QxFYec6xAqWkBYeP53MLQ"
    );
  } catch (error) {
    console.error("Gagal memproses webhook:", error);
    throw error; // Lempar error agar data masuk ke antrian skip
  }
};

// Fungsi untuk memproses antrian skip
const processSkippedQueue = async () => {
  while (skippedQueue.length > 0) {
    const skippedData = skippedQueue.shift(); // Ambil data pertama di antrian skip
    try {
      await processWebhook(skippedData); // Coba proses ulang
    } catch (error) {
      console.error("Gagal memproses ulang data skip:", error);
    }
    await delay(2000);
  }
};

// Fungsi untuk menangani incoming webhook
const handleIncomingMessage = (req, res) => {
  try {
    const incomingData = req.body;
    console.log("Webhook diterima:", incomingData.type);

    // Tambahkan data ke antrian
    webhookQueue.push(incomingData);

    // Mulai proses antrian jika tidak ada yang berjalan
    processQueue();

    res.status(200).send("Webhook diterima.");
  } catch (error) {
    console.error("Error menangani webhook:", error);
    res.status(500).send("Gagal menangani webhook.");
  }
};

// Fungsi untuk mendapatkan waktu saat ini
const getCurrentTime = () => {
  return moment().tz("Asia/Jakarta").format("HH:mm");
};

// Route endpoint webhook
router.post("/", handleIncomingMessage);

module.exports = router;
