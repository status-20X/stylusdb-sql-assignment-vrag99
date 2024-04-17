const fs = require("fs");
const csv = require("csv-parser");

const readCSV = (filePath) => {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve(results);
      });
  });
};

const writeCSV = (filePath, jsonData) => {
  return new Promise((resolve, reject) => {
    let writeStream = fs.createWriteStream(filePath);
    writeStream.write(Object.keys(jsonData[0]).join(",") + "\n"); // Write the header
    jsonData.forEach((row) => {
      writeStream.write(Object.values(row).join(",") + "\n");
    });

    writeStream.end();
    writeStream
      .on("finish", () => {
        resolve();
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

module.exports = { readCSV, writeCSV };
