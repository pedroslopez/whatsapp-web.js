# Codebase Audit Report for `whatsapp-web.js`

This document outlines the findings from a comprehensive scan of the codebase, highlighting flaws, patches, deprecated usage, and potential errors.

## 1. Architectural Flaws & Risks

### Dependency on `ModuleRaid` & Webpack Injection

- **Risk Level**: High
- **Description**: The library heavily relies on `ModuleRaid` to reverse-engineer and extract internal modules from the WhatsApp Web webpack bundle (e.g., `src/util/Injected/LegacyStore.js`).
- **Impact**: This is extremely brittle. Any update to WhatsApp Web that changes its webpack structure or module naming will immediately break the library. This is the core "flaw" of this approach.
- **Evidence**:
    - `src/util/Injected/LegacyStore.js` and `LegacyAuthStore.js` consist almost entirely of `findModule` calls.
    - Usage of `window.mR` injected into the browser context.

### Mixed Concerns in `Client` Class

- **Risk Level**: Medium
- **Description**: The `Client` class handles everything from Puppeteer browser management to high-level message logic and event emission.
- **Impact**: Makes the class massive (`Client.js` is >2500 lines) and hard to test or maintain.
- **Evidence**: `src/Client.js` contains both `puppeteer.launch` logic and WhatsApp protocol logic.

### Monkey-Patching Global `Error`

- **Risk Level**: Medium
- **Description**: The code monkey-patches the global `Error` object in the browser context to rewrite stack traces.
- **Impact**: This is a "hacky" patch that could interfere with other libraries or debugging tools running in the same context.
- **Evidence**: `src/Client.js` (L355-365):
    ```javascript
    // ocVersion (isOfficialClient patch)
    // remove after 2.3000.x hard release
    Error = function (message) { ... }
    ```

## 2. Hardcoded TODOs and Maintenance items

Multiple "TODO" and "FIXME" items were found, indicating incomplete work or technical debt.

- **Legacy Removal Deadlines**:
    - `src/util/Injected/LegacyStore.js`: `//TODO: To be removed by version 2.3000.x hard release`
    - `src/Client.js` (L354): `// remove after 2.3000.x hard release`
- **Missing Features**:
    - `./docs/scripts/jsdoc-toc.js`: `// TODO: make the node ID configurable`
- **Placeholders**:
    - `src/Client.js` (L23): Parameter documentation suggests usage of `LegacySessionAuth` which is deprecated.

## 3. Error Handling Flaws

### Throwing Strings instead of Errors

- **Risk Level**: Low/Medium
- **Description**: The code throws raw strings in several places instead of proper `Error` objects. This makes stack trace capture and error handling in calling code difficult.
- **Evidence**:
    - `src/Client.js` L111: `throw 'auth timeout';`
    - `src/Client.js` L251: `throw 'ready timeout';`
    - `src/structures/Message.js` L766: `throw 'Invalid usage! Can only be used with a pollCreation message';`

### Potentially Unsafe `eval` Usage

- **Risk Level**: Low (Context-dependent)
- **Description**: `LegacyAuthStore.js` uses `eval` to deserialize `moduleRaid`.
- **Evidence**: `src/util/Injected/AuthStore/LegacyAuthStore.js`: `eval('var moduleRaid = ' + moduleRaidStr);`

## 4. Patches and Hacks

- **"Comet" vs "Legacy" Splitting**: The codebase has bifurcated logic to support both the "Comet" (newer) and legacy versions of WhatsApp Web (`src/Client.js` L118). This adds complexity and suggests the library is in a transition phase.
- **Navigator WebDriver Fix**: `src/Client.js` L329: `browserArgs.push('--disable-blink-features=AutomationControlled');` - A common hack to avoid detection, but worth noting as a "patch".

## 5. Security & Configuration Issues

- **Insecure Default Session Path**: `src/authStrategies/LocalAuth.js` defaults to storing sessions in `./.wwebjs_auth/` relative to the execution directory. If a user isn't careful with their `.gitignore`, actionable session credentials could be committed to version control.
    - _Note_: The provided `.npmignore` correctly excludes this, but individual user projects might not.

## 6. Deprecations

- **Client Options**:
    - `restartOnAuthFail`: Marked `@deprecated`.
    - `session`: Marked `@deprecated`.
- **Event**: `BATTERY_CHANGED` event is marked deprecated in `Client.js`.

## Summary

The codebase is functional but carries significant technical debt due to its method of reverse-engineering WhatsApp Web. The heavy reliance on webpack module injection (`moduleRaid`) is the primary stability risk. There are also several code quality issues (throwing strings, massive classes) that should be addressed in future refactors.
