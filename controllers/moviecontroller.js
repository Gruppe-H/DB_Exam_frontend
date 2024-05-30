const { getMovies } = require('../databases/mssql');
const { getMovieActors } = require('../databases/neo4j');
const { getMovieReviews, createMovieReview } = require('../databases/mongodb');
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

async function addMovieReview(review) {
    const result = await createMovieReview(review);
    //update in-memory movies
    const movie = all_movies.find(m => m.id === review.movie_id);
    if (movie) {
        movie.reviews.unshift({
            user_id,
            review_date,
            review_text,
            rating,
            review_summary,
            is_spoiler
        });
    }
    return result;
}

module.exports = { getAllMovies, getMovie, getMovieDetails };