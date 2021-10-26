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

function getContent(path) {
    const fileContent = fs.readFileSync(path, 'utf8');
    fs.unlinkSync(path);
    return fileContent;
}

async function fileParser(file) {
    const movies = file.split('\n\n');
    const response = [];
    for (let i = 0; i < movies.length; i++) {
        let raw = movies[i].split('\n').map(x => x.split(': ')[1]);
        raw[3] = raw[3].split(', ');
        const [title, year, format, actors] = raw;
        const {id, createdAt, updatedAt} = await db.addMovie({title, year, format, actors});
        response.push({id, title, year, format, createdAt, updatedAt});
    }
    return response;
}

module.exports = {
    verifyToken,
    getContent,
    fileParser,
}