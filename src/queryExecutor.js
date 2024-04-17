const { parseInsertQuery, parseDeleteQuery } = require("./queryParser");
const { evaluateCondition } = require("./index");
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

async function executeDELETEQuery(query) {
  const { table, whereClauses } = parseDeleteQuery(query);
  const file = `${table}.csv`;

  const currentData = await readCSV(file);
  let updatedData =
    whereClauses.length > 0
      ? currentData.filter((row) =>
          whereClauses.every((clause) => !evaluateCondition(row, clause))
        )
      : [];

  return writeCSV(file, updatedData);
}

module.exports = { executeINSERTQuery, executeDELETEQuery };
