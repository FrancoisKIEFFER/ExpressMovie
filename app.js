const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer();

const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");

const faker = require("faker");
const config = require("./config");

const mongoose = require("mongoose");

mongoose.connect(
  `mongodb://${config.db.user}:${config.db
    .password}@ds117935.mlab.com:17935/expressmovie`
);
const db = mongoose.connection;
db.on(
  "error",
  console.error.bind(console, "connection error: cannot connect to my DB")
);
db.once("open", () => {
  console.log("Connected to the DB");
});

const movieSchema = mongoose.Schema({
  movietitle: String,
  movieyear: Number
});

const Movie = mongoose.model("Movie", movieSchema);
// const title = faker.lorem.sentence(3);
// const year = Math.floor(Math.random() * 70) + 1950;

// const myMovie = new Movie({ movietitle: title, movieyear: year });
// myMovie.save((err, savedMovie) => {
//   if (err) {
//     console.error(err);
//   } else {
//     console.log("savedMovie", savedMovie);
//   }
// });

const PORT = 3000;
let frenchMovies = [];

app.use("/public", express.static("public"));
// app.use(bodyParser.urlencoded({ extended: false }));

const secret = "expressmovie";

app.use(
  expressJwt({ secret: secret }).unless({
    path: [
      "/",
      "/movies",
      "/movie-search",
      "/login",
      "/favicon",
      new RegExp("/movies.*/", "i"),
      new RegExp("/movie-details.*/", "i")
    ]
  })
);

app.set("views", "./views");
app.set("view engine", "ejs");

app.get("/movies", (req, res) => {
  const title = "Titres français des trentes dernières années";
  frenchMovies = [];
  Movie.find((err, movies) => {
    if (err) {
      console.error("could not retrieve movies from DB");
      res.sendStatus(500);
    } else {
      frenchMovies = movies;
      res.render("movies", { movies: frenchMovies, title: title });
    }
  });
});

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.post("/movies", upload.fields([]), (req, res) => {
  if (!req.body) {
    return res.sendStatus(500);
  } else {
    const formData = req.body;
    console.log("formData: ", formData);
    // const newMovie = { title: req.body.movietitle, year: req.body.movieyear };
    // frenchMovies = [...frenchMovies, newMovie];
    // res.sendStatus(201);
    const title = req.body.movietitle;
    const year = req.body.movieyear;
    const myMovie = new Movie({ movietitle: title, movieyear: year });
    myMovie.save((err, savedMovie) => {
      if (err) {
        console.error(err);
        return;
      } else {
        console.log(savedMovie);
        res.sendStatus(201);
      }
    });
  }
});

app.get("/movies/add", (req, res) => {
  res.send("Ajouter votre film");
});

app.get("/movies/:id", (req, res) => {
  const id = req.params.id;
  const title = req.params.title;
  //   res.send(`film numero : ${id}`);
  res.render("movie-details", { movieid: id });
});

app.get("/movie-details/:id", (req, res) => {
  const id = req.params.id;
  Movie.findById(id, (err, movie) => {
    console.log("movie ", movie);
    res.render("movie-details", { movie: movie });
  });
});

app.post("/movie-details/:id", urlencodedParser, (req, res) => {
  if (!req.body) {
    return res.sendStatus(500);
  }
  console.log(
    "movietitle: ",
    req.body.movietitle,
    "movieyear: ",
    req.body.movieyear
  );
  const id = req.params.id;
  Movie.findByIdAndUpdate(
    id,
    {
      $set: { movietitle: req.body.movietitle, movieyear: req.body.movieyear }
    },
    { new: true },
    (err, movie) => {
      if (err) {
        console.log(err);
        return res.send("le film n'a pas été mis à jour");
      }
      res.redirect("/movies");
    }
  );
});

app.delete("/movie-details/:id", (req, res) => {
  const id = req.params.id;
  Movie.findByIdAndRemove(id, (err, movie) => {
    res.sendStatus(202);
  });
});

app.get("/", (req, res) => {
  //   res.send("Hello World");
  res.render("index");
});

app.get("/movie-search", (req, res) => {
  res.render("movie-search");
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Espace membre" });
});

const fakeUser = { email: "testuser@testmail.fr", password: "qsd" };

app.post("/login", urlencodedParser, (req, res) => {
  console.log("login post", req.body);
  if (!req.body) {
    res.sendStatus(500);
  } else {
    if (
      fakeUser.email === req.body.email &&
      fakeUser.password === req.body.password
    ) {
      const myToken = jwt.sign(
        { iss: "http://expressmovie.fr", user: "Sam", scope: "admin" },
        secret
      );
      res.json(myToken);
    } else {
      res.sendStatus(401);
    }
  }
});

app.get("/member-only", (req, res) => {
  console.log("req.user", req.user);
  res.send(req.user);
});

app.listen(PORT, () => {
  console.log(`listen on the port ${PORT}`);
});
