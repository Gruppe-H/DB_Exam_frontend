const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const getMovies = require('./databases/mssql')

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

// User data (for demonstration purposes, in a real app use a database)
const users = [
    { username: 'user1', password: 'password1' },
    { username: 'user2', password: 'password2' }
];

let all_movies = [];

// Routes
app.get('/', (req, res) => {
    getMovies()
        .then(movies => {
            all_movies = movies;
            res.render('index', { movies, user: req.session.user });
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).send('Internal Server Error');
        });
});

app.get('/movie/:id', (req, res) => {
    const movie = all_movies.find(m => m.id === req.params.id);
    if (movie) {
        res.render('movie', { movie, user: req.session.user });
    } else {
        res.status(404).send('Movie not found');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
