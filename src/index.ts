import {Request, Response} from "express";
import express from "express";
import NodeCache from "node-cache";
import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import { createClient } from "redis";
import Memcached from "memcached";

const CACHE_TTL = 300;
const DATABASE_NAME = "sample_mflix";
const COLLECTION_NAME = "movies"
let db: Db;
const uri = "mongodb+srv://stevenbarahona:jovyiA1M8HQObgpe@playground.cmzjd.mongodb.net/?retryWrites=true&w=majority&appName=Playground";
const REDIS_URL = 'redis://localhost:6379';
const MEMCACHED_SERVER = 'localhost:11211';

const app = express();

//initialize node-cache
const cache = new NodeCache({ stdTTL: CACHE_TTL });

//initialize redis client
const redisClient = createClient({ url: REDIS_URL });
//connect to Redis
redisClient.connect().then(() => console.log('Connected to Redis'));

//initialize Memcached client
const memcached = new Memcached(MEMCACHED_SERVER);

redisClient.on('error', (err) => console.error('Redis Error:', err));

// connect to MongoDB
async function connectToMongoDB() {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log('Connected to MongoDB');
}

// search an item by ID using node-cache
app.get('/item/nodecache/:title', async (req: Request<{ title: string }>, res: Response): Promise<any> => {
    const { title } = req.params;

    try {
        // check cache first
        const cachedData = cache.get(title);
        if (cachedData) {
            console.log('Cache hit using node-cache');
            return res.json(cachedData);
        }

        // if couldnt find movie on node-cache, search on mongodb
        console.log('Cache miss using node-cache, fetching from MongoDB');
        const collection = db.collection(COLLECTION_NAME);
        const item = await collection.findOne({ title: title });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // store in node-cache and return
        cache.set(title, item);
        res.json(item);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// search an item by title using Redis
app.get('/item/redis/:title', async (req: Request<{ title: string }>, res: Response): Promise<any> => {
    const { title } = req.params;

    try {
        // Check Redis cache first
        const cachedItem = await redisClient.get(title);

        if (cachedItem) {
            console.log('Cache hit using Redis');
            return res.json(JSON.parse(cachedItem));
        }

        console.log('Cache miss using Redis, fetching from MongoDB');
        const collection = db.collection(COLLECTION_NAME);
        const item = await collection.findOne({ title: title });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Store item in Redis cache with expiration
        await redisClient.setEx(title, CACHE_TTL, JSON.stringify(item));

        res.json(item);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// search an item by title using Memcached
app.get('/item/memcached/:title', async (req: Request<{ title: string }>, res: Response): Promise<any> => {
    const { title } = req.params;

    try {
        //check Memcached first
        //memcached does not allow whitespaces or new lines on its keys
        memcached.get(title.replace(/\s+/g, '_'), async (err, cachedData) => {
            if (err) {
                console.error('Memcached Error:', err);
                return res.status(500).json({ message: 'Cache error' });
            }

            if (cachedData) {
                console.log('Cache hit using Memcached');
                return res.json(JSON.parse(cachedData));
            }

            console.log('Cache miss using Memcached, fetching from MongoDB');
            const collection = db.collection(COLLECTION_NAME);
            const item = await collection.findOne({ title: title });

            if (!item) {
                return res.status(404).json({ message: 'Item not found' });
            }

            //store item in Memcached with expiration
            //memcached does not allow whitespaces or new lines on its keys
            memcached.set(title.replace(/\s+/g, '_'), JSON.stringify(item), CACHE_TTL, (err) => {
                if (err) console.error('Failed to cache item:', err);
            });

            res.json(item);
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Start the server
app.listen(3000, async () => {
    await connectToMongoDB();
    console.log('Server running on http://localhost:3000');
});