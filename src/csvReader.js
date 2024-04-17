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

module.exports = readCSV;
