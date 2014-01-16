# changelog as a service

The aim: permalink to http://<domain?>/<user>/<project>/<tag>

eg. /remy/nodemon/1.0.0 shows the commits since the last tag.

Live demo (though entirely in client side JS so it's not linkable): http://jsbin.com/AfosAbo/3

## TODO

- Database backend to cache commits between tags to reduce API hits
- (naked) domain (though I'd like to get it up on heroku for hosting)
- Possibly add user github auth to put the api cost on the user (though 5000 limit might be fine...)