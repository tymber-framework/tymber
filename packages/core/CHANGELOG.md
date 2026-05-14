# Changelog

| Release                  | Date          |
|--------------------------|---------------|
| [0.2.3](#023-2026-05-14) | May 2026      |
| [0.2.2](#022-2026-05-12) | May 2026      |
| [0.2.1](#021-2026-03-11) | March 2026    |
| [0.2.0](#020-2026-02-19) | February 2026 |
| [0.1.0](#010-2026-01-27) | January 2026  |
| [0.0.1](#001-2025-12-09) | December 2025 |

## [0.2.3](https://github.com/tymber-framework/tymber/compare/@tymber/core@0.2.2...@tymber/core@0.2.3) (2026-05-14)


### Dependencies

- [`ajv@~8.18.0`](https://www.npmjs.com/package/ajv/v/8.18.0) (no change)
- [`ajv-formats@~3.0.1`](https://www.npmjs.com/package/ajv-formats/v/3.0.1) (no change)


## [0.2.2](https://github.com/tymber-framework/tymber/compare/@tymber/core@0.2.1...@tymber/core@0.2.2) (2026-05-12)


### Bug Fixes

* allow multiple values for query params ([e6dce21](https://github.com/tymber-framework/tymber/commit/e6dce21f5ad80631efc5948cff428b37a97a4c49))
* handle charset in content-type header ([743a146](https://github.com/tymber-framework/tymber/commit/743a146310e48a4e15bdcd1c16a78477cc5322df))
* handle falsy config values ([5ab304f](https://github.com/tymber-framework/tymber/commit/5ab304f16e7e96badda5383293823e48d658ebdb))
* keep the order of the middlewares ([f928087](https://github.com/tymber-framework/tymber/commit/f9280872324ebd666a2e0b55462d4b2fbaefe232))
* **SQL**: handle LIMIT/OFFSET 0 in SQL query builder ([6a54673](https://github.com/tymber-framework/tymber/commit/6a546734120cbc7a7be17f7660fcbeab40372684))
* **SQL**: handle SQL IN with empty array ([732dfc8](https://github.com/tymber-framework/tymber/commit/732dfc8c99881ed8097beecf85d5764ae8b9cea1))
* **SQL**: parenthesize expressions in SQL NOT() ([d100067](https://github.com/tymber-framework/tymber/commit/d100067f2538f4534c441f51b4040d61cbc61668))

### Dependencies

- [`ajv@~8.18.0`](https://www.npmjs.com/package/ajv/v/8.18.0) (`~8.17.1` to `~8.18.0`)
- [`ajv-formats@~3.0.1`](https://www.npmjs.com/package/ajv-formats/v/3.0.1) (no change)


## [0.2.1](https://github.com/tymber-framework/tymber/compare/@tymber/core@0.2.0...@tymber/core@0.2.1) (2026-03-11)


### Bug Fixes

* ensure all components are properly closed ([8a45dcc](https://github.com/tymber-framework/tymber/commit/8a45dccfdccc68dce6395f2160585f454dbd622d))
* fix logic in tracing ([b22c5e3](https://github.com/tymber-framework/tymber/commit/b22c5e3efd99ec0731fcb685397d376d8918ba5b))
* handle out-of-order component registration ([e0d4293](https://github.com/tymber-framework/tymber/commit/e0d42930600982e7905b481c9c8e4aa6c43b574d))
* use manually provided components in priority ([e848eaf](https://github.com/tymber-framework/tymber/commit/e848eafe621adccf3d42f574c2c3962a0c18cf6b))


## [0.2.0](https://github.com/tymber-framework/tymber/compare/@tymber/core@0.1.0...@tymber/core@0.2.0) (2026-02-19)


### Features

* add audit logs ([b00e48e](https://github.com/tymber-framework/tymber/commit/b00e48e3ed8ec49bf22bf8b579d00b5cf2ccb161))
* allow transaction to return a value ([c4b6ff7](https://github.com/tymber-framework/tymber/commit/c4b6ff73eed0d676889dc85c9abf9c4fbfaf193b))


## [0.1.0](https://github.com/tymber-framework/tymber/compare/@tymber/core@0.0.1...@tymber/core@0.1.0) (2026-01-27)


### Features

* add internal user & group IDs ([267350a](https://github.com/tymber-framework/tymber/commit/267350ae43a0750b48c1b1e83f0add963b738297))
* add locale to context ([433eaad](https://github.com/tymber-framework/tymber/commit/433eaad44170a0554f68348e4960163d43273141))
* add Repository.deleteById() ([d49cb6a](https://github.com/tymber-framework/tymber/commit/d49cb6aa5234241923d7f237a0b8f324a893a8f4))
* expose I18nService and EntityNotFoundError ([56f0b27](https://github.com/tymber-framework/tymber/commit/56f0b27a0e5d9abcd48d85e4a96d981900fd3c33))
* remove poor-man audit repositories ([19a1221](https://github.com/tymber-framework/tymber/commit/19a122172b9f98ddc19628fc1198e6a41e07ec62))
* update App.create() method ([a12feeb](https://github.com/tymber-framework/tymber/commit/a12feeb5f7ad06001cd760bd0ed96dd4f7a207ce))


## 0.0.1 (2025-12-09)

Initial release!
