const { getMovies } = require('../databases/mssql');
const { getMovieActors } = require('../databases/neo4j');
const { getMovieReviews } = require('../databases/mongodb');
const getUser = require('./usercontroller');

let all_movies;

async function getAllMovies() {
    if (!all_movies) {
        all_movies = await getMovies();
    }
    return all_movies;
}

async function getMovie(movieId) {
    if (!all_movies) {
        all_movies = await getAllMovies();
    }
    return all_movies.find(m => m.id === movieId);
}

async function getMovieDetails(movie) {
    const actors = await getMovieActors(movie.id);
    const director = actors.find(actor => actor.professions.some(p => p === 'director'));
    const reviews = await getMovieReviews(movie.id);
    // reviews.forEach(async review => { 
    //     review.user = await getUser(review.user_id)
    // });
    return { movie, actors, director, reviews };
}

module.exports = { getAllMovies, getMovie, getMovieDetails };