<h1>Mail module of the Tymber framework</h1>

The mail module.

**Table of contents**

<!-- TOC -->
  * [Installation](#installation)
  * [Usage](#usage)
  * [License](#license)
<!-- TOC -->

## Installation

```
npm i @tymber/mail
```

## Usage

```ts
import { CoreModule } from "@tymber/core";
import { MailModule } from "@tymber/mail";

const app = await App.create({
  components: [db],
  modules: [CoreModule, MailModule]
});
```

## License

[MIT](./LICENSE)
