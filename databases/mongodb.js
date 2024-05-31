const { MongoClient, ObjectId } = require('mongodb');
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

async function getAllMovieReviews(movieId) {
    try {
        const collection = database.collection(process.env.MONGODB_REVIEW_COLLECTION);
        const reviews = await collection.find({ movie_id: movieId }).sort({ review_date: -1 }).toArray();
        return reviews;
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

async function getMovieReviewsByUser(userId) {
    try {
        const collection = database.collection(process.env.MONGODB_REVIEW_COLLECTION);
        const reviews = await collection.find({ user_id: userId }).toArray();
        return reviews;
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

async function getSelectionSpoilerFreeMovieReviews(movieId) {
    try {
        const collection = database.collection(process.env.MONGODB_REVIEW_COLLECTION);
        const reviews = await collection.find({
            movie_id: movieId,
            is_spoiler: false
        }).sort({ review_date: -1 }).limit(25).toArray();
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

async function deleteMovieReview(reviewId) {
    try {
        const collection = database.collection(process.env.MONGODB_REVIEW_COLLECTION);
        const result = await collection.deleteOne({ _id: new ObjectId(reviewId) });
        if (result.deletedCount === 1) {
            return { success: true };
        } else {
            return { success: false, message: 'Could not delete review' };
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
}

async function getAllRegions() {
    try {
        const collection = database.collection(process.env.MONGODB_TITLE_COLLECTION);
        const regions = await collection.distinct('region');
        return regions;
    } catch (error) {
        console.error('Error fethcing regions:', error);
        throw error;
    }
}

async function getRegionalTitles(region) {
    try {
        const collection = database.collection(process.env.MONGODB_TITLE_COLLECTION);
        const regionalTitles = await collection.find({
            region: region
        }).toArray();
        return regionalTitles;
    } catch (error) {
        console.error('Error fetching regional titles:', error);
        return [];
    }
}


module.exports = {
    connectToMongoDB, getAllMovieReviews, getSelectionSpoilerFreeMovieReviews, getMovieReviewsByUser,
    createMovieReview, deleteMovieReview, getAllRegions, getRegionalTitles
};