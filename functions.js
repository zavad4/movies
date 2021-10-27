const fs = require('fs');
const db = require('./db_functions');
const config = require('./config');

function verifyToken(headers){                                                  
    if(headers.includes('Authorization')) {
        const index  = headers.indexOf('Authorization') + 1;
        const token = headers[index];
        return (config.state.sessions.includes(token));
    };
};

function checkYear(year) {
    return (Number.isInteger(year) && year > 1850 && year < 2021);
} 

function checkChars(title, format, actors) {
    let flag = true;
    const regexp = /[^A-Za-z, -]/g;
    actors.push(title);
    actors.push(format);
    const notAllowed = actors.map(x => x.match(regexp)).flat();
    if (notAllowed.filter(x => x !== null).length) flag = false;
    return flag;
}

function checkActors(actors) {
    const set = new Set();
    for (const actor of actors) {
        if (set.has(actor)) return false;
        set.add(actor);
    }
    return true;
}

function validateMovie(data){        // data - {title, year, format, actors,}
    const {title, year, format, actors} = data;
    const flag = true;
    if(!title || !title.trim()) return {flag: false, err: "Please, enter required fields - title and year" };
    if(!checkYear(year)) {
        return {flag:false, err: "Year must be a number from 1850 to 2021"};
    }
    if(!checkChars(title, format, actors)) return {
        flag: false, 
        err: `Please, use only allowed characters in title, format and actors (letters, '-' and ',')`
    };
    if(!checkActors(actors)) return {
        flag: false,
        err: `You can't add actors with the same name.`
    }
    return {flag: true, err: null}; 
}

function getContent(path) {
    const fileContent = fs.readFileSync(path, 'utf8');
    fs.unlinkSync(path);
    return fileContent;
}

async function fileParser(file) {
    const movies = file.split('\n\n');
    let imported = 0;
    const moviesFromDB = [];
    try {
        for (let i = 0; i < movies.length; i++) {
            let raw = movies[i].split('\n').map(x => x.split(': ')[1]);
            raw[3] = raw[3].split(', ');
            let [title, year, format, actors] = raw;
            year = parseInt(year, 10);
            if(validateMovie({title, year, format, actors}).err) {
                moviesFromDB.push({title, err: validateMovie({title, year, format, actors}).err});
            } else {
                const movie = await db.addMovie({title, year, format, actors});
                if(movie) {
                    const {id, createdAt, updatedAt} = movie;
                    moviesFromDB.push({id, title, year, format, createdAt, updatedAt});
                    imported++;
                } else moviesFromDB.push({title, err: `A movie with title '${title}' already exists`})
            }
        }
        return {moviesFromDB, imported};
    } catch (e) {
        console.log(e);
        return {moviesFromDB: 'Wrong file format'}
    }
}

module.exports = {
    verifyToken,
    getContent,
    fileParser,
    validateMovie,
}