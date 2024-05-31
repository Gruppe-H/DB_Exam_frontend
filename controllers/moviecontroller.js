const { getMovies, sortMovies } = require('../databases/mssql');
const { getMovieActors } = require('../databases/neo4j');
const { createMovieReview, deleteMovieReview, getSelectionSpoilerFreeMovieReviews, 
    getAllMovieReviews, getRegionalTitles } = require('../databases/mongodb');
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

async function getAllRegionalMovies(region) {
    if (!all_movies) {
        all_movies = await getMovies();
    }

    const regionalTitles = await getRegionalTitles(region);
    for (const movie of all_movies) {
        const match = regionalTitles.find(title => title.titleId === movie.id);
        if (match) {
            movie.primary_title = match.title;
        }
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
    //update in-memory movies 
    const movie = all_movies.find(m => m.id === review.movie_id);
    if (movie) {
        movie.reviews.unshift(review);
    }
    return result;
}

async function removeMovieReview(reviewId, movieId) {
    const result = await deleteMovieReview(reviewId);
    // Update in-memory movies 
    const movie = all_movies.find(m => m.id === movieId);
    if (movie) {
        movie.reviews = movie.reviews.filter(review => review.id !== reviewId);
    }

    return result;
}

module.exports = {
    getAllMovies, getMovie, getMovieDetails,
    getMovieReviews, addMovieReview, getAllRegionalMovies, removeMovieReview
};
