<h1>Server-sent events module of the Tymber framework</h1>

The server-sent events module.

Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

**Table of contents**

<!-- TOC -->
  * [Installation](#installation)
  * [Usage](#usage)
  * [License](#license)
<!-- TOC -->

## Installation

```
npm i @tymber/sse
```

## Usage

```ts
import { SSEModule } from "@tymber/sse";

const app = await App.create({
  components: [],
  modules: [SSEModule]
});
```

## License

[MIT](./LICENSE)
