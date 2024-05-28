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

function getClient() {
    return client;
}

function getCollection() {
    const database = client.db(process.env.MONGODB_DATABASE);
    return database.collection(process.env.MONGODB_REVIEW_COLLECTION); //TODO
}

module.exports = { connectToMongoDB, getClient, getCollection };