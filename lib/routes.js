'use strict';

var github = require('octonode');
var config = require('../config');

var client = github.client({
  id: config.id,
  secret: config.secret
});

function shortDate(d) {
  var now = new Date(),
      result = '',
      year = d.getYear(),
      month = 'jan feb mar apr may jun jul aug sep oct nov dec'.split(' ');

  result = d.getDate() + '-' + month[d.getMonth()];

  if (year !== now.getYear()) {
    result += ' ' + (year + 1900);
  }

  return result;
}

function compare(repo, v1, v2, cb) {
  return client.get('/repos/' + repo + '/compare/' + v1 + '...' + v2, function(err, s, b, h) {
    if (err) {
      return cb(err);
    }
    if (s !== 200) {
      return cb(new Error('Repo compare error'));
    } else {
      return cb(null, b, h);
    }
  });
}

module.exports = function (app) {
  app.param('user', function (req, res, next) {
    client.limit(function (err, left, max) {
      console.log(left); // 4999
      console.log(max);  // 5000
    });

    req.user = req.params.user;
    next();
  });

  app.param('repo', function (req, res, next) {
    if (req.user) {
      req.repo = req.user + '/' + req.params.repo;
      client.repo(req.repo).tags(function (err, tags) {
        if (err) {
          return next(new Error(err));
        }
        req.tags = tags.map(function (tag) {
          return tag.name;
        });
        req.last = req.tags.pop();
        next();
      });
    } else {
      next(new Error('repo requires a user'));
    }
  });

  app.param('version', function (req, res, next) {
    if (req.tags) {
      console.log('compare', req.tags[req.tags.indexOf(req.params.version) + 1] || 'HEAD', req.params.version);
      compare(req.repo, req.tags[req.tags.indexOf(req.params.version) + 1] || 'HEAD', req.params.version, function (err, commits) {
        if (err) {
          if (req.params.version.indexOf('v') !== 0) {
            // try with a vX
            return res.redirect('/log/' + req.repo + '/v' + req.params.version);
          } else {
            return next(new Error(err));
          }
        }

        req.commits = commits.commits.map(function (commit) {
          commit.sha = commit.sha.slice(0, 6);
          var d = new Date(commit.commit.author.date);
          commit.shortDate = shortDate(d);
          return commit;
        });
        next();
      });
    } else {
      next(new Error('Git data was missing'));
    }
  });

  app.get('/', function (req, res) {
    res.render('index');
  });

  app.get('/log/:user/:repo/:version', function (req, res) {
    res.render('changelog', {
      tag: req.tags,
      commit: req.commits
    });
  });

  app.get('/log/:user/:repo', function (req, res) {
    console.log(req.tags);
    res.render('changelog', {
      tag: req.tags
    });
  });
};