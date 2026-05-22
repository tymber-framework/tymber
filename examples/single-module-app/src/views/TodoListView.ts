import { View, type HttpContext } from "@tymber/core";

export class TodoListView extends View {
  async handle(ctx: HttpContext) {
    return ctx.render(["layout", "todo-list"]);
  }
}
