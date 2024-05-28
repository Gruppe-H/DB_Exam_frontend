const neo4j = require('neo4j-driver');
// Envionment variables:
const dotenv = require('dotenv');
dotenv.config();

const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));

const connectToNeo4j = async () => {
    try {
        await driver.verifyConnectivity();
        console.log('Connected to Neo4j');
    } catch (error) {
        console.error('Error connecting to Neo4j:', error);
    }
};

function getDriver() {
    return driver;
}

function getSession() {
    return driver.session();
}

module.exports = { connectToNeo4j, getDriver, getSession };