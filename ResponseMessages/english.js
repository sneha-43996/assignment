exports.ERROR = {
    DEFAULT: {
        statusCode: 500,
        customMessage: 'Something went wrong.',
        type: 'DEFAULT'
    },
    WRONG_EMAIL: {
        statusCode: 400,
        customMessage: 'Email not registered.',
        type: 'WRONG_EMAIL'
    },
    INVALID_TOKEN: {
        statusCode: 403,
        customMessage: 'Invalid access token.',
        type: 'INVALID_TOKEN'
    },
    TOKEN_EXPIRED: {
        statusCode: 403,
        customMessage: 'Your access token has been expired.',
        type: 'TOKEN_EXPIRED'
    },
    SESSION_EXPIRED: {
        statusCode: 403,
        customMessage: 'Your session has been expired.',
        type: 'SESSION_EXPIRED'
    },
    INVALID_FORMAT: {
        statusCode: 400,
        customMessage: 'Invalid image format.',
        type: 'INVALID_FORMAT'
    },
};

exports.SUCCESS = {
    DEFAULT: {
        statusCode: 200,
        customMessage: 'Success.',
        type: 'DEFAULT'
    },
    LOGOUT: {
        statusCode: 200,
        customMessage: 'Logged out successfully.',
        type: 'LOGOUT'
    },
    LOGGED_IN: {
        statusCode: 200,
        customMessage: 'Logged in successfully.',
        type: 'LOGGED_IN'
    }
};

exports.swaggerDefaultResponseMessages = [
    { code: 200, message: 'OK' },
    { code: 201, message: 'CREATED' },
    { code: 400, message: 'Bad Request' },
    { code: 401, message: 'Unauthorized' },
    { code: 404, message: 'Data Not Found' },
    { code: 500, message: 'Something went wrong, try again' }
];