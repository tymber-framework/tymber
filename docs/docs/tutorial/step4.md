# Step 4: Frontend

Tymber is flexible when it comes to the frontend. It can be used as a backend for a Single Page Application (SPA) framework like [React](https://react.dev/), [Vue](https://vuejs.org/), or [Svelte](https://svelte.dev/), or as a classic Multi-Page Application (MPA) using its built-in server-side rendering engine.

In this tutorial, we will focus on the MPA approach to learn about views, templates, and internationalization.

## Static assets

Static assets (CSS, images, client-side JavaScript, etc.) are stored in the `assets/static` directory. These files are served automatically by Tymber.

For example, if you have a file at `assets/static/css/style.css`, it will be available at `/static/css/style.css`.

Let's create a basic CSS file to make our app look better:

```css title="assets/static/css/style.css"
body {
  font-family: sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}
```

## View and basic template

A **View** is a component that handles a request and returns an HTML response by rendering a template.

Full documentation: [View](../building-blocks/view.md)

### Creating the template

Templates are stored in `assets/templates` and use a simple syntax inspired by Underscore.js.

Let's create a template for our todo list:

```html title="assets/templates/todo-list.html"
<h1><%= $t('todos.title') %></h1>

<ul class="todo-list">
  <% todos.forEach(todo => { %>
    <li class="todo-item">
      <input type="checkbox" <%= todo.completed ? 'checked' : '' %> disabled>
      <span><%= todo.title %></span>
    </li>
  <% }) %>
</ul>
```

### Creating the View

Now, let's edit the `TodoRepository` to return a list of todos:

```ts title="src/repositories/TodoRepository.ts"
import { Repository, type Context, sql } from "@tymber/core";

export class TodoRepository extends Repository<number, Todo> {
  tableName = "todos";
  dateFields = ["createdAt"];

  findAll(ctx: Context) {
    const sqlQuery = sql
      .select()
      .from(this.tableName)
      .orderBy(["created_at DESC"]);

    return this.all(ctx, sqlQuery);
  }
}
```

And a View to fetch the todos from our repository and render this template.

```ts title="src/views/TodoListView.ts"
import { View, type HttpContext, INJECT } from "@tymber/core";
import { TodoRepository } from "../repositories/TodoRepository.js";

export class TodoListView extends View {
  static [INJECT] = [TodoRepository];

  constructor(private readonly todoRepository: TodoRepository) {
    super();
  }

  async handle(ctx: HttpContext) {
    const todos = await this.todoRepository.findAll(ctx);

    return ctx.render(["layout", "todo-list"], {
      todos,
    });
  }
}
```

Notice that we pass `["layout", "todo-list"]` to `ctx.render()`. This tells Tymber to render the `todo-list` template first, and then wrap it with the `layout` template.

## Reusable Layout

A layout is a template that contains the common structure of your pages (like the `<html>` and `<body>` tags, header, and footer). The content of the inner template is available via the `VIEW` variable.

Let's create the layout template:

```html title="assets/templates/layout.html"
<!DOCTYPE html>
<html lang="<%= CTX.locale %>">
<head>
  <meta charset="UTF-8">
  <title>Tymber Todo App</title>
  <!-- the '?v=x.y.z' part is used to force the browser to reload the stylesheet when the version changes (cache busting) -->
  <link rel="stylesheet" href="/static/css/style.css?v=0.0.1">
</head>
<body>
  <main>
    <%= VIEW %>
  </main>
</body>
</html>
```

## Internationalization (i18n)

Tymber has built-in support for internationalization. Translations are stored in `assets/i18n` as JSON files.

Create an English translation file:

```json title="assets/i18n/en.json"
{
  "todos": {
    "title": "My Todos"
  }
}
```

And a French one:

```json title="assets/i18n/fr.json"
{
  "todos": {
    "title": "Mes Tâches"
  }
}
```

In our template, we used `<%= $t('todos.title') %>`. Tymber will automatically detect the user's language (via the `Accept-Language` header) and provide the correct translation.

## Registration

Finally, remember to register the view in your module:

```ts title="src/module.ts"
// [...]
import { TodoListView } from "./views/TodoListView.js";

export const TodoModule: Module = {
  // [...]
  init(app) {
    // [...]
    app.view("/", TodoListView);
  },
};
```

## Ending note

That completes the tutorial! Hopefully you now have a basic knowledge about the features of Tymber.

Here's the final directory structure:

```text
my-todo-app/
├── assets/
│   ├── i18n/
│   │   ├── en.json
│   │   └── fr.json
│   ├── migrations/
│   │   └── 0001-init.sql
│   ├── static/
│   │   └── css/
│   │       └── style.css
│   └── templates/
│       ├── layout.html
│       └── todo-list.html
├── package.json
├── src/
│   ├── endpoints/
│   │   ├── CreateTodo.ts
│   │   ├── DeleteTodo.ts
│   │   ├── ReadTodo.ts
│   │   └── UpdateTodo.ts
│   ├── entrypoint.ts
│   ├── module.ts
│   ├── repositories/
│   │   └── TodoRepository.ts
│   └── views/
│       └── TodoListView.ts
├── test/
│   ├── endpoints/
│   │   ├── CreateTodo.test.ts
│   │   ├── DeleteTodo.test.ts
│   │   ├── ReadTodo.test.ts
│   │   └── UpdateTodo.test.ts
│   └── setup.ts
└── tsconfig.json
```

You can find a complete version of this application in the [`examples/single-module-app`](https://github.com/tymber-framework/tymber/tree/main/examples/single-module-app) directory.

Happy coding!
