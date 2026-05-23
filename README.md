<h1>Tymber framework</h1>

Tymber is a batteries-included framework for building TypeScript applications.

**Table of contents**

<!-- TOC -->
  * [Documentation](#documentation)
  * [Getting started](#getting-started)
    * [Bun](#bun)
    * [Node.js](#nodejs)
  * [Packages](#packages)
  * [License](#license)
<!-- TOC -->

## Documentation

https://tymber-framework.github.io/tymber/

## Getting started

### Bun

```bash
$ bun create @tymber@latest
```

### Node.js

```bash
$ npm create @tymber@latest
```

## Packages

This repository contains the following packages:

| Package            | Description                                                                |
|--------------------|----------------------------------------------------------------------------|
| `@tymber/admin`    | The admin module                                                           |
| `@tymber/client`   | Dependency-less client that can be used in a frontend project or for tests |
| `@tymber/config`   | The config module                                                          |
| `@tymber/core`     | The internals of the framework                                             |
| `@tymber/create`   | CLI to scaffold a new Tymber project                                       |
| `@tymber/openapi`  | The OpenAPI module                                                         |
| `@tymber/postgres` | The PostgreSQL module (DB & PubSubService components)                      |
| `@tymber/sqlite`   | The SQLite module                                                          |
| `@tymber/user`     | The user module                                                            |

## License

[MIT](./LICENSE)
