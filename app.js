const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const { connectToMSSQL, loginUser, searchMovieByTitle, updateUser } = require('./databases/mssql');
const { connectToNeo4j } = require('./databases/neo4j');
const { connectToMongoDB, getAllRegions } = require('./databases/mongodb');
const { getAllMovies, getAllRegionalMovies, getMovie,
    getMovieDetails, getMovieReviews, addMovieReview, removeMovieReview,
    addMovie,
    getRecommendedMovies } = require('./controllers/moviecontroller');
const { getUserReviews, getAllUsers } = require('./controllers/usercontroller');
const { runPythonScript } = require('./controllers/aicontroller');

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
const upload = multer();

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

app.get('/user', async (req, res) => {
    const errorMessage = req.flash('error');
    if (req.session.user) {
        const user = req.session.user;
        let allUsers = [];
        if (user.roleName === "admin") {
            allUsers = await getAllUsers();
        }
        const reviews = await getUserReviews(user);
        res.render('user', { reviews, user, allUsers, errorMessage });
    } else {
        res.redirect('/login');
    }
});

app.put('/user/:id/role', async (req, res) => {
    const userId = req.params.id;
    const newRole = req.body.role;

    const result = await updateUser(userId, newRole);
    if (result.success) {
        res.redirect('/user');
    } else {
        req.flash('error', result.message);
        res.redirect('/user');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
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

app.get('/search', async (req, res) => {
    try {
        const title = req.query.search;
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

app.get('/create-movie', (req, res) => {
    if (req.session.user && req.session.user.roleName === "admin") {
        res.render('movieform');
    } else {
        res.send('You must be logged in as admin to create a movie');
    }
});

app.post('/create-movie', upload.none(), async (req, res) => {
    const { movie, actors } = req.body;
    const parsedMovie = JSON.parse(movie);
    const parsedActors = JSON.parse(actors);
    const result = await addMovie(parsedMovie, parsedActors);

    if (result.success) {
        res.redirect(`/movie/${parsedMovie.id}`);
    } else {
        res.send(`Error: ${result.message}`);
    }
});

app.get('/chatbot', (req, res) => {
    res.render('chatbot', { answer: undefined });
});

app.post('/chatbot', async (req, res) => {
    const question = req.body.question;
    try {
        const response = await fetch('http://localhost:5003/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: question }),
        });
        const answer = await response.text();
        res.send(answer);
    } catch (error) {
        console.error('Error:', error);
        res.send('Error getting answer from model');
    }
});

//todo delete all this, when done:
app.get('/factorial/:number', (req, res) => {
    const number = req.params.number;
    runPythonScript('./ai/compute.py', [number], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(`Factorial of ${number} is ${result}`);
        }
    });
});

app.get('/recommend', async (req, res) => {
    if (req.session.user) {
        const userId = req.session.user.user_id;
        runPythonScript('./ai/recommend.py', [userId], async (err, result) => {
            if (err) {
                res.status(500).send(err);
            } else {
                const movieIds = JSON.parse(result)
                const movies = await getRecommendedMovies(movieIds);
                res.render('recommended', { movies, user: req.session.user });
            }
        });
    } else {
        res.send('You must be logged in as admin to delete a review');
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
