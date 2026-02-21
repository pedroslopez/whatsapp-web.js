# Git Commit Message Convention

> This is adapted from [Angular's commit convention][angular-commit-convention].

Messages must be matched by the following regex:

```ts
/^(revert: )?(feat|fix|docs|style|refactor|perf|test|build|ci|chore|types|infra)(\(.+\))?!?: .{1,72}/;
```

## Examples

### Features

Appears under "Features" header, message subheader:

```txt
feat(message): add 'downloadMedia' option
```

Additional examples:

```txt
feat(chat): add ability to pin messages
```

```txt
feat(contact): add getProfilePicUrl method
```

### Bug Fixes

Appears under "Bug Fixes" header, client subheader, with a link to issue #28:

```txt
fix(client): stop client breaking when QR code expires

Closes #28
```

Additional examples:

```txt
fix(message): handle media messages without caption correctly
```

```txt
fix(auth): resolve authentication timeout on slow connections
```

### Performance Improvements

Appears under "Performance Improvements" header, and under "Breaking Changes" with the breaking change explanation:

```txt
perf(message): remove legacyMode option

BREAKING CHANGE: The legacyMode option has been removed. The new message handling is always used for performance reasons.
```

Additional example:

```txt
perf(client): optimize event listener registration
```

### Documentation

```txt
docs(readme): update installation instructions
```

```txt
docs(api): add examples for message reactions
```

### Code Refactoring

```txt
refactor(client): simplify authentication flow
```

```txt
refactor(structures): extract common message properties
```

### Tests

```txt
test(message): add unit tests for media download
```

```txt
test(client): add integration tests for reconnection
```

### Build System

```txt
build(deps): update puppeteer to v21.0.0
```

```txt
build(webpack): optimize bundle size
```

### Continuous Integration

```txt
ci(actions): add automated release workflow
```

```txt
ci(tests): run tests on multiple node versions
```

### Chores

```txt
chore(gitignore): ignore .vscode directory
```

```txt
chore(deps): bump dependencies to latest versions
```

### Type Definitions

```txt
types(message): add missing type for MessageMedia
```

```txt
types(client): improve ClientOptions interface
```

### Code Style

```txt
style(client): fix indentation and spacing
```

### Reverts

The following commit and commit `667ecc1` do not appear in the changelog if they are under the same release. If not, the revert commit appears under the "Reverts" header:

```txt
revert: feat(message): add 'downloadMedia' option

This reverts commit 667ecc1654a317a13331b17617d973392f415f02.
```

A commit message consists of a **header**, **body** and **footer**. The header has a **type**, **scope** and **subject**:

```txt
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional.

## Revert

If the commit reverts a previous commit, it should begin with `revert:`, followed by the header of the reverted commit. In the body, it should say: `This reverts commit <hash>.`, where the hash is the SHA of the commit being reverted.

## Type

If the prefix is `feat`, `fix` or `perf`, it will appear in the changelog. However if there is any [BREAKING CHANGE](#footer), the commit will always appear in the changelog.

Other prefixes are up to your discretion. Suggested prefixes are `build`, `ci`, `docs`, `style`, `refactor`, and `test` for non-changelog related tasks.

## Scope

The scope could be anything specifying place of the commit change. For example `client`, `message`, `chat`, `contact`, `media`, `auth`, etc...

## Subject

The subject contains succinct description of the change:

- use the imperative, present tense: "change" not "changed" nor "changes"
- don't capitalize first letter
- no dot (.) at the end

## Body

Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

## Footer

The footer should contain any information about **Breaking Changes** and is also the place to
reference GitHub issues that this commit **Closes**.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines. The rest of the commit message is then used for this.

A detailed explanation can be found in this [document][commit-message-format].

[angular-commit-convention]: https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular
[commit-message-format]: https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#
