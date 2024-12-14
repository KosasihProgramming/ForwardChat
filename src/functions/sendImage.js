// utils.js
const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const { storage } = require("../config/firebase");
const path = require("path");
const fs = require("fs");

const uploadImageToFirebase = async (filePath, name) => {
  try {
    // Baca file gambar dari sistem
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `mediaClient/${name}${path.extname(filePath)}`;

    // Buat referensi ke lokasi penyimpanan Firebase
    const storageRef = ref(storage, fileName);

    // Unggah file ke Firebase
    const snapshot = await uploadBytes(storageRef, fileBuffer);

    // Dapatkan URL unduhan gambar
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log("Foto berhasil diunggah:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Gagal mengunggah foto:", error);
    throw error;
  }
};

module.exports = { uploadImageToFirebase };
