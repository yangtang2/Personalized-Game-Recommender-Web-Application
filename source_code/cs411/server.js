var express = require("express");
var bodyParser = require("body-parser");
var mysql = require("mysql2");
var path = require("path");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
var readline = require("readline-sync");

var connection = mysql.createConnection({
  host: "34.28.239.76",
  user: "root",
  password: "8848",
  database: "game_recommender",
});

connection.connect;

var app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());

// Set view engine
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

app.get("/", function (req, res) {
  res.redirect("/login");
});

// app.set("view engine", "ejs");

app.get("/search", (req, res) => {
  const userId = req.cookies.userId;

  if (!userId) {
    res.redirect("/login");
    return;
  }

  res.render("search");
});

app.get("/add", function (req, res) {
  const userId = req.cookies.userId;

  if (!userId) {
    res.redirect("/login");
    return;
  }

  res.render("add");
});

// Get all games: http://localhost/games
app.get("/games", function (req, res) {
  var sql = `SELECT * FROM games ORDER BY game_id LIMIT 50`;

  //console.log(sql);
  connection.query(sql, function (err, result) {
    if (err) {
      res.send(err);
      return;
    }

    //console.log(result);

    res.render("games", { games: result });
  });
});

// Get a game by id: http://localhost/games/16395
app.get("/games/:id", function (req, res) {
  var sql = `SELECT * FROM games WHERE game_id = ${req.params.id};`;

  //console.log(sql);
  connection.query(sql, function (err, result) {
    if (err) {
      res.send(err);
      return;
    }

    res.send(result);
  });
});

// User signup
app.get("/signup", function (req, res) {
  res.render("signup");
});

app.get("/login", function (req, res) {
  res.render("login");
});

// this code is executed when a user clicks the form submit button
app.post("/search", function (req, res) {
  var gameName = req.body.name;
  //console.log(gameName);

  var sql = `SELECT * FROM games WHERE name LIKE '%${gameName}%' LIMIT 20;`;

  //console.log(sql);
  connection.query(sql, function (err, result) {
    if (err) {
      res.send(err);
      return;
    }

    // for (let i = 0; i < result.length; i++) {
    //   names.push(result[i].name);
    // }
    res.render("search", { searchResults: result });
  });
});

// This code is executed when a user wants to add a new game
app.post("/add", function (req, res) {
  let newGameName = req.body.game_name;
  let newGameDescription = req.body.game_description;
  let newGameLink = req.body.game_link;
  let newGameImage = req.body.game_image;
  if (newGameImage.length == 0) newGameImage = "None";
  if (newGameLink.length == 0) newGameLink = "None";
  const currentDate = new Date();
  const formattedDate = currentDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  // console.log(newGameName);
  // console.log(newGameDescription);
  // console.log(newGameLink);
  // console.log(newGameImage);
  // console.log(formattedDate);

  let sql = `INSERT INTO games(name, description, release_date, image_link, game_link, popularity) VALUES(?, ?, ?, ?, ?, ?)`;

  var success_add = "success";

  connection.query(
    sql,
    [
      newGameName,
      newGameDescription,
      formattedDate,
      newGameLink,
      newGameImage,
      1,
    ],
    function (err, result) {
      if (err) {
        res.send(err);
        return;
      }
      // res.render("add", { success: success_add });
      res.redirect("/search");
    }
  );
});

app.post("/update_button", function (req, res) {
  let game_id = req.body.id;
  let newGameName = req.body.game_name;
  let newGameDescription = req.body.game_description;
  let newGameLink = req.body.game_link;
  let newGameImage = req.body.game_image;
  if (newGameImage.length == 0) newGameImage = "None";
  if (newGameLink.length == 0) newGameLink = "None";

  // console.log(newGameName);
  // console.log(newGameDescription);
  // console.log(newGameLink);
  // console.log(newGameImage);
  // console.log(formattedDate);

  let sql = `UPDATE games SET name = ?, description = ?, image_link = ?, game_link = ? WHERE game_id = ? `;

  var success_add = "success";

  connection.query(
    sql,
    [newGameName, newGameDescription, newGameLink, newGameImage, game_id],
    function (err, result) {
      if (err) {
        res.send(err);
        return;
      }
      res.render("search");
    }
  );
});

app.post("/delete", function (req, res) {
  let game_id = req.body.id;
  let sql = `DELETE FROM games WHERE game_id = ?`;

  //console.log("DELETE");

  connection.query(sql, [game_id], function (err) {
    if (err) {
      res.send(err);
      return;
    }
    res.render("search");
  });
});

app.post("/update", function (req, res) {
  //location.href = "/update";
  //console.log("UPDATE");

  let game_id = req.body.id;
  let sql = `SELECT * FROM games WHERE game_id = ?`;
  //console.log(sql);

  connection.query(sql, [game_id], function (err, result) {
    if (err) {
      res.send(err);
      return;
    }
    //console.log(result);

    res.render("update", { default_vals: result[0] });
  });
});

// Handle user purchasing games
app.post("/purchase", function (req, res) {
  console.log(req.body);
  const game_id = req.body.id;
  const userId = req.cookies.userId;
  const hours = req.body.hours;

  if (!(!isNaN(parseInt(hours)) && Number.isInteger(parseInt(hours)))) {
    // not an int
    console.log("not an int for hours");
    res.render("search", {
      duplicate: "Please enter an integer for hours played",
    });
    return;
  }

  let check_ownership = `SELECT * FROM owns WHERE game_id = ? AND user_id = ?`;

  connection.query(check_ownership, [game_id, userId], function (err, result) {
    if (err) {
      res.send(err);
      return;
    }
    if (result.length != 0) {
      res.render("search", {
        duplicate: "The game has already been purchased",
      });
    } else {
      let insert_owns = `INSERT INTO owns(user_id, game_id, played_time) VALUES(?, ?, ?)`;
      console.log(req.body.hours);
      console.log("playtime");
      connection.query(
        insert_owns,
        [Number(userId), Number(game_id), parseInt(req.body.hours)],
        function (error, result1) {
          if (error) {
            res.send(error);
            return;
          }
          // console.log(result1);
          res.redirect("/my_library");
        }
      );
    }
  });
});

app.post("/signup_done", function (req, res) {
  let username = req.body.username;
  const password = req.body.password;
  let email = req.body.email;

  // Check if email has been registered
  let email_check = `SELECT user_id FROM users WHERE email_address = ?`;
  connection.query(email_check, [email], function (err, result) {
    if (err) {
      res.send(err);
      return;
    }
    if (result.length == 0) {
      const saltRounds = 10;
      bcrypt.genSalt(saltRounds, (err, salt) => {
        if (err) {
          console.error(err);
        } else {
          bcrypt.hash(password, salt, (err, hash) => {
            if (err) {
              console.error(err);
            } else {
              // Insert information of new user
              let user = `INSERT INTO users(username, hashed_password, email_address, is_admin) VALUES(?, ?, ?, ?)`;

              connection.query(
                user,
                [username, hash, email, 0],
                function (err, result) {
                  if (err) {
                    res.send(err);
                    return;
                  }
                }
              );
              res.render("login");
            }
          });
        }
      });
    } else {
      // If email address has already been used
      let error_message = "Email address already registered";
      res.render("signup", { error: error_message });
    }
  });
});

// Verify user login
app.post("/login_verify", function (req, res) {
  let email = req.body.email;
  let password = req.body.password;

  // Check if email exists in database
  let email_exist = `SELECT user_id, username FROM users WHERE email_address = ?`;
  connection.query(email_exist, [email], function (err, result) {
    if (err) {
      res.send(err);
      return;
    }

    if (result.length == 0) {
      // User does not exist
      let error_message = "User does not exist";
      res.render("login", { error: error_message });
    } else {
      // Verify password
      let userId = result[0].user_id;
      let username = result[0].username;
      let stored_password =
        "SELECT hashed_password FROM users WHERE email_address = ?";
      connection.query(stored_password, [email], function (err, result) {
        if (err) {
          res.send(err);
          return;
        }
        let true_pwd = result[0].hashed_password;

        bcrypt.compare(password, true_pwd, (err, result) => {
          if (err) {
            console.error(err);
          } else if (result) {
            // Passwords match
            res.cookie("emailAddress", email);
            res.cookie("userId", userId);
            res.cookie("username", username);
            res.redirect("/games");
          } else {
            // Password does not match
            let no_match = "Password Mismatch";
            res.render("login", { match_error: no_match });
          }
        });
      });
    }
  });
});

app.get("/recommended", function (req, res) {
  let userId = req.cookies.userId;
  let genresToRecommend = `SELECT DISTINCT genre from recommend WHERE user_id = ${userId};`;

  connection.query(genresToRecommend, function (err, result) {
    if (err) {
      res.send(err);
      return;
    }

    let genres = result;
    console.log(genres);
    // genres = [{ genre: "Action" }, { genre: "RPG" }, { genre: "Casual" }];
    console.log(genres);
    let genreFilterQuery = "";

    for (let i = 0; i < genres.length; i++) {
      let genre = genres[i]["genre"];
      if (i == genres.length - 1) {
        let singleGenreQuery =
          '(SELECT game_id, genre, name FROM games NATURAL JOIN genres WHERE genre = "' +
          genre +
          '" ORDER BY popularity DESC LIMIT 3)';
        // console.log(singleGenreQuery);
        genreFilterQuery += singleGenreQuery;
      } else {
        let singleGenreQuery =
          '(SELECT game_id, genre, name FROM games NATURAL JOIN genres WHERE genre = "' +
          genre +
          '" ORDER BY popularity DESC LIMIT 3) UNION ';
        // console.log(singleGenreQuery);
        genreFilterQuery += singleGenreQuery;
      }
    }

    console.log(genreFilterQuery);

    connection.query(genreFilterQuery, function (err, result) {
      if (err) {
        res.send(err);
        return;
      }
      console.log(result);
      console.log("heree");
      res.render("recommended", { userId: userId, games: result });
      return;
      // res.render("library", { my_games: result });
    });
  });

  // Top 3 games the user does not own for each of these genres:

  // res.render("recommended", { userId: userId });
});

// Get user's game library
app.get("/my_library", function (req, res) {
  const userId = req.cookies.userId;
  let userName = req.cookies.username;
  let first = userName.charAt(0);
  const rest = userName.slice(1);
  first = first.toUpperCase();
  userName = first + rest;

  if (!userId) {
    res.redirect("/login");
    return;
  }

  let library =
    "SELECT DISTINCT games.name, owns.played_time FROM owns NATURAL JOIN users NATURAL JOIN games WHERE users.user_id = ?";
  connection.query(library, [userId], function (err, result) {
    if (err) {
      res.send(err);
      return;
    }
    res.render("library", { my_games: result, user_id: userName });
  });
});

// Advanced queries, stored procedure, getting statistics about your library games.
app.get("/statistics", function (req, res) {
  let userId = req.cookies.userId;
  let multipleConnections = mysql.createConnection({
    multipleStatements: true,
    host: "34.28.239.76",
    user: "root",
    password: "8848",
    database: "game_recommender",
  });

  multipleConnections.connect;

  // let firstQuery = `
  //   SELECT gs.genre, g1.game_id, g1.name, g1.popularity
  //   FROM games as g1 JOIN genres as gs ON (g1.game_id = gs.game_id)
  //   WHERE (gs.genre, g1.popularity) IN (SELECT g.genre, MAX(ga.popularity)
  //         FROM games as ga JOIN genres as g ON (ga.game_id = g.game_id)
  //         GROUP BY g.genre
  //   )
  //   ORDER BY g1.popularity DESC
  // `;

  // let secondQuery = `
  //   SELECT g.genre AS genre, SUM(o.played_time) AS play_time
  //   FROM owns as o JOIN genres as g ON (o.game_id = g.game_id)
  //   WHERE o.user_id = ${userId}
  //   GROUP BY g.genre
  //   ORDER BY SUM(o.played_time) DESC
  // `;

  // Call the store procedure here:
  multipleConnections.query(
    // firstQuery + " ; " + secondQuery + " ; " +
    `CALL generate_statistics(${userId});`,
    function (err, results) {
      if (err) {
        res.send(err);
        return;
      }

      let selectStatistics = `SELECT * FROM statistics1; SELECT * FROM statistics2;`;

      multipleConnections.query(selectStatistics, function (err, result) {
        if (err) {
          res.send(err);
          return;
        }

        let userStatistics = result[0];
        let globalStatistics = result[1];
        // console.log(result);
        // console.log("heree");
        res.render("statistics", {
          userId: userId,
          userStatistics: userStatistics,
          globalStatistics: globalStatistics,
        });
        return;
        // res.render("library", { my_games: result });
      });
      // console.log("0-0");
      // console.log(results);

      // let result1 = results[0];
      // let result2 = results[1];
      // res.render("statistics", {
      //   firstQueryResult: result1,
      //   secondQueryResult: result2,
      // });
    }
  );
});

app.listen(80, function () {
  console.log("Node app is running on port 80");
});
