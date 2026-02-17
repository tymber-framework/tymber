# Template engine

Tymber includes a lightweight templating engine heavily inspired by [Underscore.js](https://underscorejs.org/#template) micro-templates.

## File structure

Templates are stored in the `assets/templates` directory of your module with a `.html` extension:

```text
my-module/
├── assets/
│   ├── i18n/              
│   ├── migrations/        
│   ├── static/
// highlight-next-line
│   └── templates/       
├── src/
│   ├── admin-endpoints/    
│   ├── admin-views/        
│   ├── endpoints/          
│   ├── repositories/       
│   ├── services/           
│   ├── utils/              
│   └── views/              
└── test/        
```

Examples:

- `assets/templates/home.html`
- `assets/templates/layout.html`

## Syntax

The templating engine supports three types of tags:

| Tag          | Usage                                |
|--------------|--------------------------------------|
| `<% ... %>`  | Execute arbitrary JavaScript code.   |
| `<%= ... %>` | Interpolate a value (HTML-escaped).  |
| `<%- ... %>` | Interpolate a value (raw/unescaped). |

Example:

```html
<% if (items.length > 0) { %>
  <ul>
    <% items.forEach(function(item) { %>
      <li><%= item.name %></li>
    <% }); %>
  </ul>
<% } else { %>
  <p>No items found.</p>
<% } %>
```

## Usage

To render a template from a [`View`](../building-blocks/view.md) component:

```ts
import { View, HttpContext } from "@tymber/core";

export class HomeView extends View {
    async handle(ctx: HttpContext) {
        const items = await this.someService.getItems();
        return ctx.render(["home"], { items });
    }
}
```

### Nested templates

You can pass an array of templates to `ctx.render()`. They will be rendered from last to first, with each template's output available as the `VIEW` variable in the next one. This is useful for layouts.

```ts
return ctx.render(["layout", "home"], { items });
```

In `layout.html`:

```html
<!DOCTYPE html>
<html>
<body>
  <header>...</header>
  <main>
    <%= VIEW %>
  </main>
  <footer>...</footer>
</body>
</html>
```

### Injected Variables

The following variables are automatically available in all templates:

| Variable               | Description                                                                        |
|------------------------|------------------------------------------------------------------------------------|
| `TITLE`                | Defaults to "Tymber".                                                              |
| `CTX`                  | The current `HttpContext`.                                                         |
| `CTX.app.isProduction` | Boolean indicating if the app is running in production.                            |
| `CTX.app.modules`      | Array of registered modules.                                                       |
| `$t()`                 | The translation function (see [Internationalisation](../getting-started/i18n.md)). |
| `VIEW`                 | The output of the previously rendered template (when using nested templates).      |

## Manual rendering

You can also inject the `TemplateEngine` into your components and manually render templates. This can be useful, for example, to send e-mails or create PDF documents.

Example:

```ts
import {
    Context,
    Component,
    INJECT,
    TemplateEngine,
} from "@tymber/core";

export class MyMailService extends Component {
    static [INJECT] = [TemplateEngine];

    constructor(private readonly TemplateEngine: TemplateEngine) {
        super();
    }

    async sendWelcomeMail(ctx: Context) {
        const output = await this.TemplateEngine.render("mail-welcome", {
            name: "John",
        });

        // ...
    }
}
```
