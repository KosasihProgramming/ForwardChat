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

const openai = new OpenAI({
  apiKey:
    "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", // Masukkan API key langsung di sini
});
const getDataGroup = (data, transaksi) => {
  const result = transaksi.map((b) => {
    const profil = data.find((p) => p.norm == b.id);

    // // Menampilkan norm dari data dan id dari transaksi pada setiap iterasi
    // console.log(
    //   `norm: ${profil ? profil.norm : "Tidak ditemukan"}, id: ${b.id}`
    // );

    return {
      id: b.customerid,
      nama: b.name,
      no_telpon: profil ? profil.telp : "0",
    };
  });
  return result;
};

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

async function insertMessageToThread(
  assistance_id,
  threadResponse,
  text,
  chat_id,
  id_bot,
  nama,
  retryCount = 0
) {
  try {
    // Batasi jumlah percobaan hingga maksimal 4 kali
    if (retryCount > 4) {
      sendMessageTele(
        "<b>Ada Error Dalam Proses Penyisipan Pesan Ke AI</b>",
        chat_id,
        id_bot
      );
      InsertBug("kosasih", "Max retries reached", {
        assistance_id,
        threadResponse,
        text,
        retryCount,
      });
      return {
        success: false,
        message: "Max retries reached, operation failed",
      };
    }

    // Buat pesan dengan role "assistant" dan masukkan ke dalam thread
    await openai.beta.threads.messages.create(threadResponse, {
      role: "assistant",
      content: text,
    });

    console.log("Pesan telah disisipkan sebagai 'assistant'.");

    // Ambil seluruh riwayat pesan dalam thread setelah menyisipkan pesan
    const replyMessages = await openai.beta.threads.messages.list(
      threadResponse
    );
    const allMessages = replyMessages.data.map((message) => ({
      role: message.role,
      content:
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content),
    }));

    // Kirim permintaan untuk mendapatkan respons dari AI menggunakan endpoint chat completions
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: allMessages,
    });

    // Ambil balasan AI dari respons
    const assistantMessages = replyMessages.data.filter(
      (message) => message.role === "assistant"
    );

    console.log(assistantMessages, "ass");

    // Mengembalikan hasil dari proses penyisipan pesan ke thread dan respons AI
    return {
      success: true,
      threadResponse,
      assistantMessages,
      latestAssistantMessage:
        aiResponse.choices[0].message.content || "Tidak ada balasan dari AI.",
    };
  } catch (error) {
    console.error("Error in insertMessageToThread, retrying...:", error);

    // Jika error adalah karena run yang masih aktif, tunggu beberapa detik sebelum retry
    if (
      error.error &&
      error.error.message &&
      error.error.message.includes("active")
    ) {
      console.log("Menunggu 20 detik sebelum mencoba lagi...");
      await new Promise((resolve) => setTimeout(resolve, 20000)); // Tunggu 20 detik sebelum mencoba lagi
    } else {
      // Log error using InsertBug when there's an error that is not related to active runs
      await InsertBug(
        "kosasih",
        "AI Process ( No reply )",
        error.message || error
      );
    }

    // Lakukan percobaan lagi (retry)
    return insertMessageToThread(
      assistance_id,
      threadResponse,
      text,
      chat_id,
      id_bot,
      nama,
      retryCount + 1
    );
  }
}

async function InsertBug(contact_name, is, bug) {
  return new Promise((resolve, reject) => {
    // If `bug` is not a string, use JSON.stringify to convert it to a JSON-formatted string
    const bugString = typeof bug === "string" ? bug : JSON.stringify(bug);

    // Sanitize the `bug` value by removing any problematic characters
    const sanitizedBug = bugString.replace(/['"]/g, "");

    // Menggunakan query parameterized untuk keamanan dari SQL Injection
    const addQuery = `
      INSERT INTO bug (name, \`in\`, bug, timestamp)
      VALUES (?, ?, ?, NOW());
    `;

    // Menjalankan query dengan parameter untuk menghindari SQL Injection
    connection.query(
      addQuery,
      [contact_name, is, sanitizedBug],
      (error, result) => {
        if (error) {
          console.error("Error executing query:", error);
          return reject({ status: 500, message: "Database error" });
        }

        console.log("Berhasil Menambah bug");
        // Mengirimkan hasil query sebagai promise
        resolve({ status: "Berhasil" });
      }
    );
  });
}
module.exports = {
  sendMessageTele,
  saveBase64File,
  sendTelegramMessage,
  sendTelegramImage,
  insertMessageToThread,
};
