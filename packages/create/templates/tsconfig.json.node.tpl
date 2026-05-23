{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@tsconfig/node24/tsconfig.json",
  "compilerOptions": {
    "types": ["node"],
    "verbatimModuleSyntax": true
  },
  "include": [
    "src/**/*.ts",
    "test/**/*.ts"
  ]
}
