<h1>OpenAPI module of the Tymber framework</h1>

The OpenAPI module.

**Table of contents**

<!-- TOC -->
  * [Installation](#installation)
  * [Usage](#usage)
  * [License](#license)
<!-- TOC -->

## Installation

```
npm i @tymber/openapi
```

## Usage

```ts
import { OpenAPIModule } from "@tymber/openapi";

const app = await App.create({
  components: [db],
  modules: [OpenAPIModule]
});
```

## License

[MIT](./LICENSE)
