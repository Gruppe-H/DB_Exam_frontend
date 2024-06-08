const { getMovies, createMovie } = require('../databases/mssql');
const { getMovieActors, createMovieActors } = require('../databases/neo4j');
const { createMovieReview, deleteMovieReview, getSelectionSpoilerFreeMovieReviews,
    getAllMovieReviews, getRegionalTitles } = require('../databases/mongodb');
const { getUser } = require('./usercontroller');

let all_movies;

async function getAllMovies() {
    if (!all_movies) {
        all_movies = await getMovies();
    }

    return all_movies;
}

async function getAllRegionalMovies(region) {
    const regionalTitles = await getRegionalTitles(region);
    let all_movies = await getMovies();
    for (const movie of all_movies) {
        const match = regionalTitles.find(title => title.titleId === movie.id);
        if (match) {
            movie.primary_title = match.title;
        }
    }
    return all_movies;
}

async function getRecommendedMovies(movieIds) {
    let movies = []
    for (const movieId of movieIds) {
        const movie = await getMovie(movieId);
        movies.push(movie);
    }
    return movies;
}

async function getMovie(movieId) {
    let all_movies = await getAllMovies();
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
    let all_movies = await getAllMovies();
    const movie = all_movies.find(m => m.id === review.movie_id);
    if (movie) {
        movie.reviews.unshift(review);
    }
    return result;
}

async function removeMovieReview(reviewId, movieId) {
    const result = await deleteMovieReview(reviewId);
    // Update in-memory movies 
    let all_movies = await getAllMovies();
    const movie = all_movies.find(m => m.id === movieId);
    if (movie) {
        movie.reviews = movie.reviews.filter(review => review.id !== reviewId);
    }

    return result;
}

async function addMovie(movie, actors) {
    const movieResult = await createMovie(movie);
    if (movieResult.success) {
        const actorResult = await createMovieActors(movie.id, actors);
        if (actorResult.success) {
            // update in-memory
            let all_movies = await getAllMovies();
            const foundMovie = all_movies.find(m => m.id === movie.id);
            if (!foundMovie) {
                all_movies.unshift(movie);
            }
            return movieResult;
        } else {
            return actorResult;
        }
    }
    return movieResult;
}

module.exports = {
    getAllMovies, getMovie, getMovieDetails, addMovie, getRecommendedMovies, 
    getMovieReviews, addMovieReview, getAllRegionalMovies, removeMovieReview
};
