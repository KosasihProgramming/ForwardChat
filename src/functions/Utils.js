const axios = require("axios");
const moment = require("moment");
const { connectionTeluk } = require("../config/Database.js");
const path = require("path");
const OpenAI = require("openai");
const FormData = require("form-data");
const fs = require("fs");
const connection = require("../config/Database.js");
require("moment/locale/id"); // Mengimpor bahasa Indonesia untuk moment.js

// Mengatur locale ke bahasa Indonesia
moment.locale("id");



const sendMessageTele = async (text, chat_id, bot) => {
  try {
    const fetch = await import("node-fetch");
    console.log("https://api.telegram.org/bot" + bot + "/sendMessage");
    const response = await fetch.default(
      "https://api.telegram.org/bot" + bot + "/sendMessage",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chat_id,
          // message_thread_id: "3069",
          text: text,
          parse_mode: "html",
        }),
      }
    );

    // Cek apakah respons dari fetch adalah OK (status code 200)
    if (response.ok) {
      console.log("berhasilllllll");
    } else {
      console.log(response);
      console.log("gagalllllll");
    }
  } catch (error) {
    // Tangani kesalahan yang terjadi selama fetch
    console.error("Error:", error);
    // alert("Terjadi kesalahan. Silakan coba lagi.");
  }
};

async function sendTelegramMessage(caption, chat_id, bot, imageUrl) {
  const telegramApiUrl = `https://api.telegram.org/bot${bot}/sendPhoto`;

  try {
    const response = await axios.post(telegramApiUrl, {
      chat_id: chat_id,
      photo: imageUrl,
      caption: caption,
    });

    if (response.data.ok) {
      console.log("Message sent successfully:", response.data);
    } else {
      console.error("Error sending message:", response.data);
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

async function sendTelegramImage(caption, chat_id, bot, imagePath) {
  const url = `https://api.telegram.org/bot${bot}/sendPhoto`;

  const form = new FormData();
  form.append("chat_id", chat_id);
  form.append("photo", fs.createReadStream(imagePath));
  form.append("caption", caption);

  try {
    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
      },
    });
    if (response.status === 200) {
      console.log("Image sent successfully!");
    } else {
      console.log(
        `Failed to send image. Status code: ${response.status}, Response: ${response.data}`
      );
    }
  } catch (error) {
    console.error("Error sending image:", error);
  }
}

// Function untuk menyimpan file base64 ke disk dan mengembalikan URL file
function saveBase64File(
  base64Data,
  filename,
  folderPath = "./uploads",
  extension = "jpg"
) {
  try {
    // Cek apakah folder tujuan ada, jika tidak buat folder baru
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Tentukan path file dengan nama dan ekstensi
    const filePath = path.join(folderPath, `${filename}.${extension}`);

    // Simpan file ke disk (menggunakan base64 encoding)
    fs.writeFileSync(filePath, base64Data, { encoding: "base64" });

    // Return URL atau path dari file yang disimpan
    return filePath;
  } catch (error) {
    console.error("Error saat menyimpan file:", error);
    return null;
  }
}

module.exports = {
  sendMessageTele,
  saveBase64File,
  sendTelegramMessage,
  sendTelegramImage,
};
