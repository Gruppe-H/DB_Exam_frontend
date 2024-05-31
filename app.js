const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const { connectToMSSQL, loginUser, searchMovieByTitle} = require('./databases/mssql');
const { connectToNeo4j } = require('./databases/neo4j');
const { connectToMongoDB, getAllRegions } = require('./databases/mongodb');
const { getAllMovies, getAllRegionalMovies, getMovie,
    getMovieDetails, getMovieReviews, addMovieReview, removeMovieReview } = require('./controllers/moviecontroller');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.use(flash());
app.use(methodOverride('_method'));

// Routes
app.get('/', async (req, res) => {
    try {
        if (req.session.region) {
            movies = await getAllRegionalMovies(req.session.region);
            res.render('index', { movies, user: req.session.user });
        } else {
            movies = await getAllMovies();
            res.render('index', { movies, user: req.session.user });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/movie/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        const movie = await getMovie(movieId);

        if (movie) {
            const movieDetails = await getMovieDetails(movie);
            res.render('movie', { ...movieDetails, user: req.session.user });
        } else {
            res.status(404).send('Movie not found');
        }
    } catch (error) {
        console.error('Error fetching movie data:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/login', (req, res) => {
    const errorMessage = req.flash('error');
    res.render('login', { errorMessage });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await loginUser(username, password);
    if (result.success) {
        req.session.user = result.user;
        res.redirect('/');
    } else {
        req.flash('error', result.message);
        res.redirect('/login');
    }
});

app.get('/region', async (req, res) => {
    try {
        const regions = await getAllRegions();
        res.render('region', { regions });
    } catch (error) {
        console.error('Error fetching regions:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/region', async (req, res) => {
    const selectedRegion = req.body.selectedRegion;
    req.session.region = selectedRegion;
    res.redirect('/');
});

app.get('/review/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        const movie = await getMovie(movieId);

        if (movie) {
            const reviews = await getMovieReviews(movie);
            res.render('reviews', { movie, reviews, user: req.session.user });
        } else {
            res.status(404).send('Movie not found');
        }
    } catch (error) {
        console.error('Error fetching movie reviews:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/review/:id', async (req, res) => {
    if (req.session.user) {
        const movieId = req.params.id;
        const reviewId = req.body.review_id;

        try {
            const result = await removeMovieReview(reviewId, movieId);
            if (result.success) {
                res.redirect(`/movie/${req.params.id}`);
            } else {
                res.status(404).send('Movie not found');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.send('You must be logged in as admin to delete a review');
    }
});

app.post('/review/:id', async (req, res) => {
    if (req.session.user) {
        const { movie_id, user_id, rating, review_text, review_summary, is_spoiler } = req.body;
        const review = {
            review_date: new Date().toISOString().split('T')[0],
            movie_id,
            user_id,
            review_text,
            rating,
            review_summary,
            is_spoiler: is_spoiler === 'on'
        };

        try {
            const result = await addMovieReview(review);
            if (result.success) {
                res.redirect(`/movie/${req.params.id}`);
            } else {
                res.status(404).send('Movie not found');
            }
        } catch (error) {
            console.error('Error adding review:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.send('You must be logged in to leave a review');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/sort/:type', async (req, res) => {
    try {
        const movies = await getAllMovies();
        if (req.params.type === 'rating') {
            movies.sort((a, b) => b.rating - a.rating); // Descending order for rating
        } else if (req.params.type === 'release') {
            movies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date)); // Descending order for release date
        } else if (req.params.type === 'title') {
            movies.sort((a, b) => a.primary_title.localeCompare(b.primary_title)); // Ascending order for title
        }
        res.render('index', { movies, user: req.session.user });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// New route for searching movies by title
app.get('/search', async (req, res) => {
    console.log('Search query:', req.query);
    try {
        const title = req.query.search;
        console.log('Title:', title);
        if (!title) {
            res.render('search', { movies: [], user: req.session.user });
            return;
        }

        const movies = await searchMovieByTitle(title);
        res.render('index', { movies, user: req.session.user });
    } catch (error) {
        console.error('Error searching for movies:', error);
        res.status(500).send('Internal Server Error');
    }
});

const startServer = async () => {
    try {
        await connectToMSSQL();
        await connectToNeo4j();
        await connectToMongoDB();
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();
