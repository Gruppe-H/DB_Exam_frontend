const { getMovieReviewsByUser } = require('../databases/mongodb');
const { getUserById } = require('../databases/mssql');

async function getUser(userId) {
    const user = await getUserById(userId);
    return user;
}

async function getUserReviews(user) {
    const reviews = await getMovieReviewsByUser(user.user_id);
    for (const review of reviews) {
        review.user = user;
    }
    return reviews;
}

module.exports = { getUser, getUserReviews };