import { join } from "node:path";
import { type Module } from "@tymber/core";
import { TodoRepository } from "./repositories/TodoRepository.js";
import { ListTodos } from "./endpoints/ListTodos.js";
import { CreateTodo } from "./endpoints/CreateTodo.js";
import { ReadTodo } from "./endpoints/ReadTodo.js";
import { UpdateTodo } from "./endpoints/UpdateTodo.js";
import { DeleteTodo } from "./endpoints/DeleteTodo.js";
import { TodoListView } from "./views/TodoListView.js";

export const TodoModule: Module = {
  name: "single-module-app",
  version: "0.0.1",

  assetsDir: join(import.meta.dirname, "..", "assets"),

  async init(app) {
    app.component(TodoRepository);

    app.endpoint("GET", "/api/todos", ListTodos);
    app.endpoint("POST", "/api/todos", CreateTodo);
    app.endpoint("GET", "/api/todos/:todoId", ReadTodo);
    app.endpoint("PUT", "/api/todos/:todoId", UpdateTodo);
    app.endpoint("DELETE", "/api/todos/:todoId", DeleteTodo);

    app.view("/", TodoListView);
  },
};
