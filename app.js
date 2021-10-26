
const express = require("express");
const multer = require('multer');
const upload = multer({dest:'uploads/'});
const app = express();

const db = require('./db_functions');
const functions = require('./functions');
const config = require('./config');

const PORT = 8000;

let total = 0;

function dataRowHandler(req, res, next){
    let data = "";
    req.on('data', (chunk) => {
            data += chunk;
        })
    req.on('end', function() {
       req.rawBody = data;
       next();
    })
 }

app.post('/api/v1/users', dataRowHandler, async function(req, res){                 //CREATE USER
    const data = JSON.parse(req.rawBody);
    const {email, name, password} = data;
    res.setHeader('Access-Control-Allow-Origin', '*');
    if ((data.password === data.confirmPassword) && (await db.checkEmail(email))) {
        const {id, createdAt, updatedAt} = await db.createUser({email, name, password});
        res.json({
            token: db.genToken({id, email, name, createdAt, updatedAt}),
            status: 1,
        });
    } else res.sendStatus(400);
});

app.post('/api/v1/sessions', dataRowHandler, async function(req, res){             //CREATE SESSION
    res.setHeader('Access-Control-Allow-Origin', '*');
    const data = JSON.parse(req.rawBody);
    const user = await db.verifyUser(data);
    if(user) {
        const token = db.genToken(user);
        config.state.sessions.push(token);
        res.json({
            token,
            status: 1,
        });
    } else res.sendStatus(401);
})

app.post("/api/v1/movies", dataRowHandler, async function (req, res) {          //CREATE MOVIE
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (functions.verifyToken(req.rawHeaders)) { 
        const movieFromReq = JSON.parse(req.rawBody);
        const movieFromDB = await db.addMovie(movieFromReq);
        res.json({data: movieFromDB, status: 1});
    } else res.sendStatus(401);
});

app.delete("/api/v1/movies/:id", dataRowHandler, async function (req, res) {    //DELETE
    res.setHeader('Access-Control-Allow-Origin', '*');
    if(functions.verifyToken(req.rawHeaders)) {
        const status = await db.deleteMovie(req.params.id);
        res.send({status});
    } else res.sendStatus(401);
});

app.patch('/api/v1/movies/:id', dataRowHandler, async function(req, res) {      //UPDATE
    res.setHeader('Access-Control-Allow-Origin', '*');
    if(functions.verifyToken(req.rawHeaders)) {
        const dataToUp = JSON.parse(req.rawBody);
        const movie = await db.updateMovie(req.params.id, dataToUp);
        if(movie) res.json({ data : movie, status: 1});
        else res.status(404).send("No such movie");
    } else res.sendStatus(401);
})

app.get('/api/v1/movies/:id', dataRowHandler, async function(req, res) {      //SHOW
    res.setHeader('Access-Control-Allow-Origin', '*');
    if(functions.verifyToken(req.rawHeaders)) {
        const movie = await db.selectMovie(req.params.id);
        if(movie) res.json({ data: movie, status: 1});
        else res.status(404).send('No such movie');
    } else res.sendStatus(401);
})

app.get('/api/v1/movies', async function(req, res) {                        //List
    res.setHeader('Access-Control-Allow-Origin', '*');
    if(functions.verifyToken(req.rawHeaders)) {
        let data = [];
        let {actor, title, search, sort, order, limit, offset} = req.query;
        if(limit) limit = parseInt(limit);
        if(offset) offset = parseInt(offset);
        if(search) {
            data = [...(await db.findMovieByActor(search, sort, order, limit, offset)), 
                ...(await db.findMovieByTitle(actor, sort, order, limit, offset))];
        }
        else if (actor) {
            data = await db.findMovieByActor(actor, sort, order, limit, offset);
        } else if (title) {
            data = await db.findMovieByTitle(title, sort, order, limit, offset);
        } else data = await db.findMovie(sort, order, limit, offset);
        if(data.length) res.json({
            data, 
            meta: {total: data.length}, 
            status: 1
        });
        else res.status(404).send('No such movie');
    } else res.sendStatus(401);
})

app.get('/api/v1/movies/import', async function(req, res) {             
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.render(`${__dirname}/form.html`);
})

app.post('/api/v1/movies/import', upload.single('movies'), async (req, res) => {    //IMPORT
    res.setHeader('Access-Control-Allow-Origin', '*');
    if(functions.verifyToken(req.rawHeaders)) {
        const path = req.file.path;
        const moviesFromFile = functions.getContent(path);
        const moviesFromDB = await functions.fileParser(moviesFromFile);
        if(moviesFromDB) {
            const imported = moviesFromDB.length;
            total += imported;
            res.json({data: moviesFromDB, imported, total, status:1});
        }
    } else res.sendStatus(401);
});

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
