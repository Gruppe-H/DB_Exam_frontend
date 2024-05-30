const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const { connectToMSSQL } = require('./databases/mssql');
const { connectToNeo4j } = require('./databases/neo4j');
const { connectToMongoDB } = require('./databases/mongodb');
const { getAllMovies, getMovie, getMovieDetails } = require('./controllers/moviecontroller');

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

// User data (for demonstration purposes, in a real app use a database) - todo find users in databases
const users = [
    { username: 'user1', password: 'password1' },
    { username: 'user2', password: 'password2' }
];

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
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    //todo - change this to actually have some login
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        req.session.user = user;
        res.redirect('/');
    } else {
        res.send('Invalid username or password');
    }
});

app.post('/review/:id', (req, res) => {
    if (req.session.user) {
        const { review } = req.body;
        // todo -change this
        const movie = all_movies.find(m => m.id === parseInt(req.params.id));
        if (movie) {
            movie.reviews.push({ user: req.session.user.username, text: review });
            res.redirect(`/movie/${req.params.id}`);
        } else {
            res.status(404).send('Movie not found');
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
