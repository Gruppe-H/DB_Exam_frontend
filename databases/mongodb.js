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
        const reviews = await collection.find({ movie_id: movieId }).sort({ review_date: -1 }).toArray();
        return reviews;
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

async function createMovieReview(review) {
    try {
        const collection = database.collection(process.env.MONGODB_REVIEW_COLLECTION);
        const result = await collection.insertOne(review);
        if (result.insertedId) {
            return { success: true };
        } else {
            return { success: false, message: 'Could not save review' };
        }
    } catch (error) {
        console.error('Error creating review:', error);
        throw error;
    }
}

module.exports = { connectToMongoDB, getMovieReviews, createMovieReview };