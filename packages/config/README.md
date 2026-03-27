<h1>Config module of the Tymber framework</h1>

The config module.

**Table of contents**

<!-- TOC -->
  * [Installation](#installation)
  * [Usage](#usage)
  * [License](#license)
<!-- TOC -->

## Installation

```
npm i @tymber/config
```

## Usage

```ts
import { ConfigModule } from "@tymber/config";

const app = await App.create({
  components: [db],
  modules: [ConfigModule]
});
```

## License

[MIT](./LICENSE)
