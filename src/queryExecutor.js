const { parseInsertQuery } = require("./queryParser");
const { readCSV, writeCSV } = require("./csvReader");

async function executeINSERTQuery(query) {
  const { table, columns, values } = parseInsertQuery(query);
  const file = `${table}.csv`;

  const currentData = await readCSV(file);
  let newData = {};

  columns.forEach((column, index) => {
    newData[column] = values[index];
  });

  return writeCSV(file, [...currentData, newData]);
}

module.exports = executeINSERTQuery;
