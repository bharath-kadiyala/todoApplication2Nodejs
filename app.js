const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

//Initializing

initializeDbServerIntoResponse = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3004, () => {
      console.log("Server started at http://localhost/3000/");
    });
  } catch (error) {
    console.log(error.message);
  }
};
initializeDbServerIntoResponse();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

//API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND priority = '${priority}';
            `;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';
            `;
      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';
            `;
      break;
    default:
      getTodosQuery = `
            SELECT
                *
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%'
            `;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `
    SELECT
        *
    FROM
        todo 
    WHERE 
        id = ${todoId};
    `;
  const todo = await db.get(todoQuery);
  response.send(todo);
});

//API 3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
    INSERT INTO
        todo (id, todo, priority, status)
    VALUES
        ('${id}', '${todo}', '${priority}', '${status}')
    `;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const previousQuery = `
    SELECT 
        *
    FROM
        todo
    WHERE 
        id = ${todoId};
    `;
  const previousTodo = await db.get(previousQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
        todo
    SET
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}'
    WHERE
        id = ${todoId};
    `;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM
        todo
    WHERE 
        id = '${todoId}'
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
