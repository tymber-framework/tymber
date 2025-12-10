<h1>Core module of the Tymber framework</h1>

Dependency-less client that can be used in a frontend project or for tests.

**Table of contents**

<!-- TOC -->
  * [Installation](#installation)
  * [Usage](#usage)
  * [License](#license)
<!-- TOC -->

## Installation

```
npm i @tymber/client
```

## Usage

```ts
import { AdminClient } from "@tymber/client";

const client = new AdminClient("https://example.com");

await client.logIn({
  username: "admin",
  password: "changeit"
});
```

## License

[MIT](./LICENSE)
