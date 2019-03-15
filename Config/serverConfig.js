var SERVER = {
    APP_NAME: process.env.APP_NAME,
    PORTS: {
        HAPI: process.env.PORT
    },
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
};


module.exports = {
    SERVER: SERVER
};