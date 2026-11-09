<h1>Log module of the Tymber framework</h1>

**Table of contents**

<!-- TOC -->
  * [Installation](#installation)
  * [Usage](#usage)
  * [License](#license)
<!-- TOC -->

## Installation

```
npm i @tymber/log
```

## Usage

Register the module in your application:

```ts
import { LogModule } from "@tymber/log";

const app = await App.create({
  components: [db],
  modules: [LogModule]
});
```

Then inject the logger into your components:

```ts
import { Component, INJECT, LogService } from "@tymber/core";

export class MyComponent extends Component {
  static [INJECT] = [LogService]

  constructor(private readonly log: LogService) {
    super();
  }

  doSomething() {
    this.log.info("doing something");
  }
}
```

## License

[MIT](./LICENSE)
