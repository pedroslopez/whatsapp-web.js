/**
 * Default implementation of a web version cache that does nothing.
 */
class WebCache {
    async resolve() { return null; }
    async persist() { }
    isRunningInAwsLambda() {
        return process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV;
    }
}

class VersionResolveError extends Error { }

module.exports = {
    WebCache,
    VersionResolveError
};