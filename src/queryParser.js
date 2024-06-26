function parseSelectQuery(query) {
  try {
    // Trim the query to remove any leading/trailing whitespaces
    query = query.trim();

    const limitSplit = query.split(/\sLIMIT\s/i);
    const queryWithoutLimit = limitSplit[0]; // Everything before LIMIT clause

    let limit = limitSplit.length > 1 ? parseInt(limitSplit[1]) : null;

    const orderBySplit = queryWithoutLimit.split(/\sORDER BY\s/i);
    const queryWithoutOrderBy = orderBySplit[0]; // Everything before ORDER BY clause

    let orderByFields =
      orderBySplit.length > 1
        ? orderBySplit[1]
            .trim()
            .split(",")
            .map((field) => {
              const [fieldName, order] = field.trim().split(/\s+/);
              return { fieldName, order: order ? order.toUpperCase() : "ASC" };
            })
        : null;

    // Split the query at the GROUP BY clause if it exists
    const groupBySplit = queryWithoutOrderBy.split(/\sGROUP BY\s/i);
    const queryWithoutGroupBy = groupBySplit[0]; // Everything before GROUP BY clause

    // GROUP BY clause is the second part after splitting, if it exists
    let groupByFields =
      groupBySplit.length > 1
        ? groupBySplit[1]
            .trim()
            .split(",")
            .map((field) => field.trim())
        : null;

    // Split the query at the WHERE clause if it exists
    const whereSplit = queryWithoutGroupBy.split(/\sWHERE\s/i);
    const queryWithoutWhere = whereSplit[0]; // Everything before WHERE clause

    // WHERE clause is the second part after splitting, if it exists
    const whereClause = whereSplit.length > 1 ? whereSplit[1].trim() : null;

    // Split the remaining query at the JOIN clause if it exists
    const joinSplit = queryWithoutWhere.split(/\s(INNER|LEFT|RIGHT) JOIN\s/i);
    let selectPart = joinSplit[0].trim(); // Everything before JOIN clause

    let isDistinct = false;
    if (selectPart.toUpperCase().includes("SELECT DISTINCT")) {
      isDistinct = true;
      selectPart = selectPart.replace("DISTINCT", "").trim();
    }

    // Parse the SELECT part
    const selectRegex = /^SELECT\s(.+?)\sFROM\s(.+)/i;
    const selectMatch = selectPart.match(selectRegex);

    if (!selectMatch) {
      throw new Error("Invalid SELECT format");
    }

    const [, fields, table] = selectMatch;

    // Extract JOIN information
    const { joinType, joinTable, joinCondition } =
      parseJoinClause(queryWithoutWhere);

    // Parse the WHERE part if it exists
    let whereClauses = [];
    if (whereClause) {
      whereClauses = parseWhereClause(whereClause);
    }

    // Check for the presence of aggregate functions without GROUP BY
    const aggregateFunctionRegex =
      /(\bCOUNT\b|\bAVG\b|\bSUM\b|\bMIN\b|\bMAX\b)\s*\(\s*(\*|\w+)\s*\)/i;
    const hasAggregateWithoutGroupBy =
      aggregateFunctionRegex.test(query) && !groupByFields;

    return {
      fields: fields.split(",").map((field) => field.trim()),
      table: table.trim(),
      whereClauses,
      joinType,
      joinTable,
      joinCondition,
      groupByFields,
      hasAggregateWithoutGroupBy,
      orderByFields,
      limit,
      isDistinct,
    };
  } catch (error) {
    throw new Error(`Query parsing error: ${error.message}`);
  }
}

function parseWhereClause(whereString) {
  return whereString.split(/ AND | OR /i).map((conditionString) => {
    if (conditionString.includes(" LIKE ")) {
      const [field, pattern] = conditionString.split(/\sLIKE\s/i);
      return {
        field: field.trim(),
        operator: "LIKE",
        value: pattern.trim().replace(/^'(.*)'$/, "$1"),
      };
    } else {
      const conditionRegex = /(.*?)(=|!=|>|<|>=|<=)(.*)/;
      const match = conditionString.match(conditionRegex);
      if (match) {
        const [, field, operator, value] = match;
        return { field: field.trim(), operator, value: value.trim() };
      }
      throw new Error("Invalid WHERE clause format");
    }
  });
}

function parseJoinClause(query) {
  const joinRegex =
    /\s(INNER|LEFT|RIGHT) JOIN\s(.+?)\sON\s([\w.]+)\s*=\s*([\w.]+)/i;
  const joinMatch = query.match(joinRegex);

  if (joinMatch) {
    return {
      joinType: joinMatch[1].trim(),
      joinTable: joinMatch[2].trim(),
      joinCondition: {
        left: joinMatch[3].trim(),
        right: joinMatch[4].trim(),
      },
    };
  }

  return {
    joinType: null,
    joinTable: null,
    joinCondition: null,
  };
}

function parseInsertQuery(query) {
  const insertRegex = /^INSERT INTO (\w+) \((.+)\) VALUES \((.+)\)$/i;
  const insertMatch = query.match(insertRegex);

  if (!insertMatch) {
    throw new Error("Invalid INSERT query format");
  }

  const [, table, columns, values] = insertMatch;

  return {
    type: "INSERT",
    table,
    columns: columns.split(",").map((column) => column.trim()),
    values: values
      .split(",")
      .map((value) => value.trim().replace(/^'(.*)'$/, "$1")),
  };
}

function parseDeleteQuery(query) {
  query = query.trim();

  const whereSplit = query.split(/\sWHERE\s/i);
  const queryWithoutWhere = whereSplit[0].trim();

  const deleteRegex = /^DELETE FROM (\w+)/i;
  const deleteMatch = queryWithoutWhere.match(deleteRegex);

  let whereClauses =
    whereSplit.length > 1 ? parseWhereClause(whereSplit[1]) : [];
    
  if (deleteMatch) {
    const [, table] = deleteMatch;
    return {
      type: "DELETE",
      table,
      whereClauses,
    };
  } else {
    throw new Error(`Malformed DELETE query`);
  }
}

module.exports = {
  parseSelectQuery,
  parseJoinClause,
  parseInsertQuery,
  parseDeleteQuery,
};
