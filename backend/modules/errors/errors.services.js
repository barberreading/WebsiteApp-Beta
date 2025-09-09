const jwt = require('jsonwebtoken');
const { logError, getErrorLogs, resolveErrorLog } = require('../../utils/errorLogger');

const logFrontendError = async (errorData, authorizationHeader) => {
    const { message, stack, componentStack, url, userAgent } = errorData;

    let userId = null;
    let userRole = null;

    if (authorizationHeader) {
        const token = authorizationHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.user.id;
                userRole = decoded.user.role;
            } catch (err) {
                console.log('Invalid token in error report');
            }
        }
    }

    const errorMessage = typeof message === 'object' ? JSON.stringify(message) : message;

    await logError(
        new Error(errorMessage),
        {
            userId,
            userRole,
            url,
            userAgent,
            componentStack: typeof componentStack === 'object' ? JSON.stringify(componentStack) : componentStack,
            stack: typeof stack === 'object' ? JSON.stringify(stack) : stack
        }
    );
};

const getErrors = async (queryParams) => {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const resolved = queryParams.resolved === 'true' ? true :
        queryParams.resolved === 'false' ? false : null;

    const filters = {};
    if (resolved !== null) {
        filters.resolved = resolved;
    }

    return await getErrorLogs(page, limit, filters);
};

const resolveError = async (errorId, userId, resolution) => {
    if (!resolution) {
        throw new Error('Resolution is required');
    }

    const updatedLog = await resolveErrorLog(errorId, userId, resolution);

    if (!updatedLog) {
        throw new Error('Error log not found');
    }

    return updatedLog;
};

module.exports = {
    logFrontendError,
    getErrors,
    resolveError
};