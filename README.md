# Cache system code examples

This repository contains an example application using Typescript, Node.js and Express to show how to use the basic caching functionality of: Node-Cache, Memcached and Redis.

We use a MongoDB Atlas database set with the sample data offered by default when we create a new database. The main collection used from this database is "movies".

The application uses Express.js to create a server that listens for requests. Said requests will be movie titles, so the app will search for a title in the cache first, if its not found, it will perform the lookup on Mongo.

## Set up

To use the app we need to run ``` npm install ``` to install the necessary dependencies first.

Also we will need to set up a WSL instance with Ubuntu to run the Redis server. Once we have the WSL instance we install Redis with ``` sudo apt install redis-server ``` and then run it with ``` redis-server ```

## Usage

To run the app we execute:
```
npm run build
npm run start
```
With the app running, we can make http requests using curl. These are a few example requests asking for a movie title using the 3 cache systems:

```
curl http://localhost:3000/item/redis/Gertie%20the%20Dinosaur
curl http://localhost:3000/item/nodecache/Gertie%20the%20Dinosaur
curl http://localhost:3000/item/memcached/Gertie%20the%20Dinosaur
```

### Example output
App output:
```
PS C:\Users\StevenBarahona\dev\Projects\Personal\CacheSystemExamples> npm run start

> cachesystemexamples@1.0.0 start
> node dist/index.js

Connected to Redis
Connected to MongoDB
Server running on http://localhost:3000
Cache miss using node-cache, fetching from MongoDB
Cache hit using node-cache
Cache miss using Memcached, fetching from MongoDB
Cache hit using Memcached
Cache miss using Redis, fetching from MongoDB
Cache hit using Redis

```
Request output:
```
PS C:\Users\StevenBarahona\dev\Projects\Personal\CacheSystemExamples> curl http://localhost:3000/item/redis/Gertie%20the%20Dinosaur    


StatusCode        : 200
StatusDescription : OK
Content           : {"_id":"573a1390f29313caabcd50e5","plot":"The cartoonist, Winsor McCay, brings the Dinosaurus back to life in the figure of his latest creation, Gertie the     
                    Dinosaur.","genres":["Animation","Short","Co...
RawContent        : HTTP/1.1 200 OK
                    Connection: keep-alive
                    Keep-Alive: timeout=5
                    Content-Length: 1141
                    Content-Type: application/json; charset=utf-8
                    Date: Mon, 24 Feb 2025 23:08:01 GMT
                    ETag: W/"475-WMPH0Jpvu5fe0ePTW...
Forms             : {}
Headers           : {[Connection, keep-alive], [Keep-Alive, timeout=5], [Content-Length, 1141], [Content-Type, application/json; charset=utf-8]...}
Images            : {}
InputFields       : {}
Links             : {}
ParsedHtml        : mshtml.HTMLDocumentClass
RawContentLength  : 1141
```
