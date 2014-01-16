'use strict';


module.exports = Git;

var request = require('request'),
    RSVP = require('rsvp'),
    semver = require('semver'),
    urls = { tags: 'https://api.github.com/repos/%repo%/tags',
      compare: 'https://api.github.com/repos/%repo%/compare/%v1%...%v2%'
    },
    tags = {},
    cache = {}; // TODO move to redis or mongo

function listener(event) {
  console.log(event);
}

RSVP.configure('instrument', false);
RSVP.on('created', listener);
RSVP.on('chained', listener);
RSVP.on('fulfilled', listener);
RSVP.on('rejected', listener);


function Git(user, project) {
  var repo = user + '/' + project;
  if (cache[repo]) {
    console.log(cache[repo].tags);
    return cache[repo];
  }

  this.user = user;
  this.project = project;
  this.repo = repo;
  this.data = {
    tags: [],
    commits: [],
    last: null
  };

  cache[repo] = this;

  return this;
}

Git.prototype = {
  getCompare: function (version) {
    return new RSVP.Promise(function (resolve, reject) {
      if (this.data.commits[version]) {
        console.log('hitting cache');
        return resolve(this.data.commits[version]);
      }


      var prev = this.data.tags[this.data.tags.indexOf(version) + 1] || this.data.last;
      get(getCompareURL(this.repo, prev, version)).then(function (data) {
        var tmp;
        try {
          tmp = JSON.parse(data);
          console.log(tmp);
        } catch (e) {
          // try less of the cache
          var tmp = {};
          tmp[version] = data;
          try {
            tmp = JSON.parse(cache);
            console.warn('Reduced cache down to a single version');
          } catch (e) {
            console.error('Could not store data in cache');
          }
        }
        this.data.commits[version] = tmp.map(function (commit) {
          commit.sha = commit.sha.slice(0, 6);
          var d = new Date(commit.commit.author.date);
          commit.shortDate = shortDate(d);
          return commit;
        });

        resolve(this);

      }.bind(this), function (error) {
        this.data.commits[version] = {
          error: error
        };
        reject(error);
      }.bind(this));
    }.bind(this));
  },

  tags: function () {
    return new RSVP.Promise(function (resolve, reject) {
      if (this.data.tags.length) {
        console.log('cached');
        return resolve(this);
      }

      get(getTagURL(this.repo)).then(function (data) {
        var tags = [];
        try {
          tags = JSON.parse(data);
          console.log(tags);
        } catch (e) {
          return reject(e);
        }

        this.data.tags = tags.map(function (tag) {
          return tag.name;
        // }).sort(function (a, b) {
        //   // sort by latest release at the top
        //   try {
        //     return semver.gt(b, a) ? 1 : -1;
        //   } catch (e) {
        //     return 0;
        //   }
        });

        this.data.last = this.data.tags.pop();

        resolve(this);

      }.bind(this));
    }.bind(this));
  }
};

function get(url) {
  return new RSVP.Promise(function (resolve, reject) {
    request({ url: url, headers: {'User-Agent': 'request'}}, function (error, response, body) {
      if (error) {
        return reject(error);
      }

      resolve(body);
    });
  });
}

function getTagURL(repo) {
  return urls.tags.replace('%repo%', repo);
}

function fetch(obj, path) {
  var parts = [],
      root = '';
  if (obj[path] !== undefined) {
    return obj[path];
  } else if (path) {
    parts = path.split('.');
    root = parts.shift();
    if (obj[root] !== undefined) {
      return fetch(obj[root], parts.join('.'));
    }
  }

  return undefined;

}

function template(data) {
  return rawTemplate.replace(/(%.+?%)/g, function (a, match) {
    var key = match.slice(1, -1);
    return fetch(data, key) || '';
  });
}

function getCompareURL(repo, prev, current) {
  // pretty sure this can be simplied, but it'll do for now
  return urls.compare.replace('%repo%', repo).replace('%v1%', prev).replace('%v2%', current);
}

function shortDate(d) {
  var now = new Date,
      result = '',
      year = d.getYear(),
      month = 'jan feb mar apr may jun jul aug sep oct nov dec'.split(' ');

  result = d.getDate() + '-' + month[d.getMonth()];

  if (year != now.getYear()) {
    result += ' ' + year;
  }

  return result;
}

/*
$('form').onsubmit = function (event) {
  event.preventDefault();

  repo = repoInput.value;

  get(getTagURL()).then(function (data) {
    tags = data.map(function (tag) {
      return tag.name;
    });

    last = tags.pop();

    versions.innerHTML = tags.map(function (tag) {
      return '<option>' + tag + '</option>';
    }).join('');

    versions.parentNode.hidden = false;
    lookup.hidden = true;
    versions.onchange.call(versions);
  }, function () {
    console.log('something went wrong');
    console.log.apply(console, [].slice.apply(arguments));
  });
};

versions.onchange = function () {
  getCompare(this.value).then(function (data) {
    release.innerHTML = data.commits.filter(function (commit) {
      return commit.commit.message.indexOf('Merge') !== 0;
    }).map(function (commit) {
      commit.sha = commit.sha.slice(0, 6);
      var d = new Date(commit.commit.author.date);
      commit.short_date = shortDate(d);
      return commit;
    }).reverse().map(template).join('');
  }, function () {
    console.log('compare fetch failed');
  });
};
*/