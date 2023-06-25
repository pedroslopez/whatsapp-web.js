## Running tests

These tests require an authenticated WhatsApp Web session, as well as an additional phone that you can send messages to.

This can be configured using the following environment variables:
- `WWEBJS_TEST_SESSION`: A JSON-formatted string with legacy auth session details. Must include `WABrowserId`, `WASecretBundle`, `WAToken1` and `WAToken2`.
- `WWEBJS_TEST_SESSION_PATH`: Path to a JSON file that contains the legacy auth session details. Must include `WABrowserId`, `WASecretBundle`, `WAToken1` and `WAToken2`.
- `WWEBJS_TEST_CLIENT_ID`: `clientId` to use for local file based authentication.
- `WWEBJS_TEST_REMOTE_ID`: A valid WhatsApp ID that you can send messages to, e.g. `123456789@c.us`. It should be different from the ID used by the provided session.

You *must* set `WWEBJS_TEST_REMOTE_ID` **and** either `WWEBJS_TEST_SESSION`, `WWEBJS_TEST_SESSION_PATH` or `WWEBJS_TEST_CLIENT_ID` for the tests to run properly.

### Multidevice
Some of the tested functionality depends on whether the account has multidevice enabled or not. If you are using multidevice, you should set `WWEBJS_TEST_MD=1`.