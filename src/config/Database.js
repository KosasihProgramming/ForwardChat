const mysql = require("mysql");

const dbConfig = {
  host: "202.157.189.177",
  port: "3306",
  user: "aris",
  password: "Kosasih20!8",
  database: "chatwaotomatis",
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Connected to database");
});

module.exports = connection;
