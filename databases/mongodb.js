const { MongoClient } = require('mongodb');
// Envionment variables:
const dotenv = require('dotenv');
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

const connectToMongoDB = async () => {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};

const database = client.db(process.env.MONGODB_DATABASE);

async function getMovieReviews(movieId) {
    try {
        const collection = database.collection(process.env.MONGODB_REVIEW_COLLECTION);
        const reviews = await collection.find({ movie_id: movieId }).toArray();
        return reviews;
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}


module.exports = { connectToMongoDB, getMovieReviews };