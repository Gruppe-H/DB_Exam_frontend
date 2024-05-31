const { getAllMovies } = require('../controllers/moviecontroller');

async function testsortMovies() {
    // Call getAllMovies function with sortBy parameter set to 'title'
    const sortedMovies = await getAllMovies('title');

    // Check if the movies are sorted by title in ascending order
    let isSorted = true;
    for (let i = 1; i < sortedMovies.length; i++) {
        if (sortedMovies[i - 1].primary_title.localeCompare(sortedMovies[i].primary_title) > 0) {
            // If the previous movie's title is greater than the current movie's title, it's not sorted
            isSorted = false;
            break;
        }
    }
    expect(isSorted).toBe(true);
}

testsortMovies();
