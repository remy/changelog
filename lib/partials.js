'use strict';
var hbs = require('hbs'),
    fs = require('fs'),
    path = require('path'),
    RSVP = require('rsvp'),
    rePartial = /.*?\.html$/;

function readdir(dir) {
  return new RSVP.Promise(function (resolve, reject) {
    fs.readdir(dir, function (err, files) {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

function loadPartial(filename) {
  return new RSVP.Promise(function (resolve, reject) {
    fs.readFile(filename, 'utf8', function (err, template) {
      if (err) {
        return reject(err);
      }

      resolve(hbs.registerPartial(path.basename(filename, '.html'), template));
    });
  });
}

module.exports = function () {
  var partialsDir = path.join(__dirname, '..', 'views', 'partials');
  return readdir(partialsDir).then(function (files) {
    var promises = [];

    files.forEach(function (file) {
      if (rePartial.test(file)) {
        promises.push(loadPartial(path.resolve(partialsDir, file)));
      }
    });

    return RSVP.all(promises);
  });
};