<h1>User module of the Tymber framework</h1>

The user module.

**Table of contents**

<!-- TOC -->
  * [Installation](#installation)
  * [Usage](#usage)
  * [License](#license)
<!-- TOC -->

## Installation

```
npm i @tymber/user
```

## Usage

```ts
import { AdminModule } from "@tymber/admin";
import { UserModule } from "@tymber/user";

const app = await App.create({
  components: [db],
  modules: [AdminModule, UserModule]
});
```

## License

[MIT](./LICENSE)
