'use strict';
var express = require('express'),
    routes = require('./routes'),
    partials = require('./partials'),
    app = express();

app.configure(function () {
  var logger = process.env.LOGGER || 'tiny';

  if (logger !== 'none') {
    app.use(express.logger(logger));
  }

  app.set('views', 'views');
  app.set('view engine', 'html');
  app.engine('html', require('hbs').__express);

  app.use(express.cookieParser(app.set('session secret')));

  app.use(express.static('public'));
  app.use(app.router);

  routes(app);
});

partials().then(function () {
  app.listen(process.env.PORT || 8000);
}, function () {
  console.log.apply(console, [].slice.apply(arguments));
  console.log('rejected');
});
