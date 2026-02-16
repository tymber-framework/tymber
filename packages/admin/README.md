<h1>Admin module of the Tymber framework</h1>

The admin module.

**Table of contents**

<!-- TOC -->
  * [Installation](#installation)
  * [Usage](#usage)
  * [License](#license)
<!-- TOC -->

## Installation

```
npm i @tymber/admin
```

## Usage

```ts
import { AdminModule } from "@tymber/admin";

const app = await App.create({
  components: [db],
  modules: [AdminModule],
});
```

## License

[MIT](./LICENSE)
