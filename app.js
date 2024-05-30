const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const { connectToMSSQL, loginUser } = require('./databases/mssql');
const { connectToNeo4j } = require('./databases/neo4j');
const { connectToMongoDB} = require('./databases/mongodb');
const { getAllMovies, getMovie, getMovieDetails, addMovieReview } = require('./controllers/moviecontroller');

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

// Routes
app.get('/', async (req, res) => {
    try {
        movies = await getAllMovies();
        res.render('index', { movies, user: req.session.user });
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
