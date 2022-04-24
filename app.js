const express = require("express");
const { open } = require("sqlite");
const app = express();
const sqlite3 = require("sqlite3");
const path = require("path");
const { format, isValid } = require("date-fns");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
app.use(express.json());

const initializingDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server And Db Initialized Successfully");
    });
  } catch (e) {
    console.log(`DbError: ${e.message}`);
    process.exit(1);
  }
};

initializingDbAndServer();

const validatingStatus = (request, response, next) => {
  const { status = "" } = request.query;
  if (status !== "") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      console.log("valid");
      next();
    } else {
      console.log("invalid");
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    next();
  }
};

const validateDate = (request, response, next) => {
  let { date = "" } = request.query;
  if (isValid(new Date(date))) {
    next();
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

const validatingPriority = (request, response, next) => {
  const { priority = "" } = request.query;
  if (priority !== "") {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      console.log("valid");
      next();
    } else {
      console.log("invalid");
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    next();
  }
};

const validatingCategory = (request, response, next) => {
  const { category = "" } = request.query;
  if (category !== "") {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      console.log("valid");
      next();
    } else {
      console.log("invalid");
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    next();
  }
};

const GettingEachTodo = (eachTodo) => {
  return {
    id: eachTodo.id,
    todo: eachTodo.todo,
    priority: eachTodo.priority,
    status: eachTodo.status,
    category: eachTodo.category,
    dueDate: eachTodo.due_date,
  };
};

app.get(
  "/todos/",
  validatingStatus,
  validatingPriority,
  validatingCategory,
  async (request, response) => {
    const {
      status = "",
      search_q = "",
      priority = "",
      category = "",
    } = request.query;
    const QueryForGettingTodoContainingGivenDetails = `SELECT * 
    FROM todo WHERE status LIKE '%${status}%' AND 
    todo LIKE '%${search_q}%'AND 
    priority LIKE '%${priority}%' AND 
    category LIKE '%${category}%';`;
    const listOfTodos = await db.all(QueryForGettingTodoContainingGivenDetails);
    response.send(listOfTodos.map((eachTodo) => GettingEachTodo(eachTodo)));
  }
);

app.get(
  "/todos/:todoId/",
  validatingStatus,
  validatingPriority,
  validatingCategory,
  async (request, response) => {
    const {
      status = "",
      search_q = "",
      priority = "",
      category = "",
    } = request.query;
    const { todoId } = request.params;
    const QueryForGettingTodoContainingGivenDetailsForId = `SELECT * 
    FROM todo WHERE status LIKE '%${status}%' AND 
    todo LIKE '%${search_q}%'AND 
    priority LIKE '%${priority}%' AND 
    category LIKE '%${category}%'AND 
    id = ${todoId};`;
    const todoDetails = await db.get(
      QueryForGettingTodoContainingGivenDetailsForId
    );
    response.send(todoDetails);
  }
);

app.get("/agenda/", validateDate, async (request, response) => {
  let { date = "" } = request.query;
  let dateObject = new Date(date);
  console.log(dateObject);
  reqDate = format(dateObject, "yyyy-MM-dd");
  console.log(reqDate);
  const QueryForGettingTodoContainingGivenDate = `SELECT *
   FROM todo WHERE due_date = '${reqDate}';`;
  const listOfTodos = await db.all(QueryForGettingTodoContainingGivenDate);
  response.send(listOfTodos.map((eachTodo) => GettingEachTodo(eachTodo)));
});

app.post("/todos/", async (request, response) => {
  let requestBody = request.body;
  let { id, todo, priority, status, category, dueDate } = request.body;
  const QueryForUpdatingTodo = `INSERT INTO todo(id,todo,priority,status,category,due_date)
    VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  await db.run(QueryForUpdatingTodo);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let requestBody = request.body;
  let {
    todo = "",
    priority = "",
    status = "",
    category = "",
    dueDate = "",
  } = request.body;
  console.log(todoId);
  const QueryForUpdatingTodo = `UPDATE todo SET todo = '${todo}',priority= '${priority}',status = '${status}',category = '${category}',due_date ='${dueDate}'
    WHERE id = ${todoId};`;
  await db.run(QueryForUpdatingTodo);
  if (status !== "") {
    response.send("Status Updated");
  } else if (priority !== "") {
    response.send("Priority Updated");
  } else if (todo !== "") {
    response.send("Todo Updated");
  } else if (category !== "") {
    response.send("Category Updated");
  } else if (dueDate !== "") {
    response.send("Due Date Updated");
  }
});
