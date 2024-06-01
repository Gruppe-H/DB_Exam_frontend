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

function getSession() {
    return driver.session();
}

async function getMovieActors(movieId) {
    const session = getSession();
    try {
        const result = await session.run(
            `MATCH (m:Movie {id: $movieId})<-[:KNOWN_FOR]-(a:Actor)-[:IS_A]->(p:Profession)
            WITH a, p
            ORDER BY p.name
            RETURN a, collect(p.name) as professions`,
            { movieId }
        );

        return result.records.map(record => ({
            actor: record.get('a').properties,
            professions: record.get('professions').map(p => p.replace(/_/g, ' '))
        }));
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    } finally {
        await session.close();
    }
}

async function createMovieActors(movieId, actors) {
    const session = getSession();
    const transaction = session.beginTransaction();
    try {
        const queries = actors.map(actor => {
            return transaction.run(
                `MATCH (m:Movie {id: $movieId})
                WITH m
                MERGE (a:Actor {id: $actorId})
                SET a.name = $actorName,
                    a.birthYear = $birthYear,
                    a.deathYear = $deathYear
                MERGE (a)-[:KNOWN_FOR]->(m)
                WITH a
                UNWIND $professions AS professionName
                MERGE (p:Profession {name: professionName})
                MERGE (a)-[:IS_A]->(p)
                `,
                {
                    movieId,
                    actorId: actor.id,
                    actorName: actor.name,
                    birthYear: actor.birthYear,
                    deathYear: actor.deathYear,
                    professions: actor.professions.map(p => p.replace(/ /g, '_'))
                }
            );
        });

        await Promise.all(queries);
        await transaction.commit();
        return { success: true };
    } catch (error) {
        console.error('Error executing query:', error);
        await transaction.rollback();
        return { success: false, message: 'Could not create movie actors' };
    } finally {
        await session.close();
    }
}

module.exports = { connectToNeo4j, getMovieActors, createMovieActors };