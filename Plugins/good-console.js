var Good = require('good');

//Register Good Console

exports.register = function(server, options, next) {

    server.register({
        register: Good,
        options: {
            ops: {
                interval: 1000
            },
            reporters: {
                myConsoleReporter: [{
                        module: 'good-squeeze',
                        name: 'Squeeze',
                        args: [{ log: '*', response: '*' }]
                    },
                    {
                        module: 'good-console'
                    }, 'stdout'
                ],
            }
        }
    }, function(err) {
        if (err) {
            throw err;
        }
    });

    next();
};

exports.register.attributes = {
    name: 'good-console-plugin'
};