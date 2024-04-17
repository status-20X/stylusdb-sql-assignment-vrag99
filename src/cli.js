const readline = require("readline");
const { executeINSERTQuery, executeDELETEQuery } = require("./queryExecutor");
const { executeSELECTQuery } = require("./index");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.setPrompt("SQL> ");
console.log(
  'SQL Query Engine CLI. Enter your SQL commands, or type "exit" to quit.'
);

rl.prompt();

rl.on("line", async (line) => {
  if (line.toLowerCase() === "exit") {
    rl.close();
    return;
  }

  try {
    if (line.toLowerCase().startsWith("select")) {
      const selection = await executeSELECTQuery(line);
      console.log('Result:', selection);
    } else if (line.toLowerCase().startsWith("insert into")) {
      const res = await executeINSERTQuery(line);
      console.log(res.message);
    } else if (line.toLowerCase().startsWith("delete from")) {
      const res = await executeDELETEQuery(line);
      console.log(res.message);
    } else {
      throw new Error(`Malformed query`);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }

  rl.prompt();
}).on("close", () => {
  console.log("Exiting SQL CLI");
  process.exit(0);
});
