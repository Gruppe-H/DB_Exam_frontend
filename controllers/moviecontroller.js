const { getMovies, sortMovies } = require('../databases/mssql');
const { getMovieActors } = require('../databases/neo4j');
const { createMovieReview, getSelectionSpoilerFreeMovieReviews, getAllMovieReviews } = require('../databases/mongodb');
const getUser = require('./usercontroller');

let all_movies;

async function getAllMovies(sortBy) {
    if (!all_movies) {
        all_movies = await getMovies();
    }

    if (sortBy) {
        all_movies = await sortMovies(sortBy, all_movies);
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
    const reviews = await getSelectionSpoilerFreeMovieReviews(movie.id);
    for (const review of reviews) {
        review.user = await getUser(review.user_id);
    }

    return { movie, actors, director, reviews };
}

async function getMovieReviews(movie) {
    const reviews = await getAllMovieReviews(movie.id);
    for (const review of reviews) {
        review.user = await getUser(review.user_id);
    }
    return reviews;
}

async function addMovieReview(review) {
    const result = await createMovieReview(review);
    //update in-memory movies - todo doesn't work
    const movie = all_movies.find(m => m.id === review.movie_id);
    if (movie) {
        movie.reviews.unshift({
            user_id: review.user_id,
            review_date: review.review_date,
            review_text: review.review_text,
            rating: review.rating,
            review_summary: review.review_summary,
            is_spoiler: review.is_spoiler
        });
    }
    return result;
}



module.exports = { getAllMovies, getMovie, getMovieDetails, getMovieReviews, addMovieReview };