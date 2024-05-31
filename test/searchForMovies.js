const { searchForMovies } = require('../databases/mssql');

async function testSearchForMovies() {
    const movieTitle = 'The Kid'; // Replace with the title you want to search for
    const movies = await searchForMovies(movieTitle);
    console.log('Search Results:', movies);
}

testSearchForMovies();