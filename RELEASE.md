# Release steps

1. Update the version in `package.json`
2. Update the version in the dependent packages (so that `npm ci` succeeds)
3. Generate the changelog

```bash
cd packages/core
conventional-changelog -p angular --tag-prefix "@tymber/core" --commit-path .
```

4. In `@tymber/core`, if one static file has changed, upgrade the version in `admin.layout.html` (for cache busting)
5. Commit the changes to `package.json` and `CHANGELOG.md`
6. Create the tag `@tymber/core@x.y.z` and push it to the GitHub repository. The workflow `.github/workflows/publish.yml` will safely publish the package to npm using trusted publishing.
