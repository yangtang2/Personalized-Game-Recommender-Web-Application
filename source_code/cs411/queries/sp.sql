
CREATE PROCEDURE generate_statistics(IN userid INT)
BEGIN
 DECLARE genre VARCHAR(255);
 DECLARE play_time INT;
 DECLARE num_game INT;
 DECLARE avg_pop INT;
 DECLARE fan_level VARCHAR(255);
 DECLARE exit_loop BOOLEAN DEFAULT FALSE;

 DECLARE custCur CURSOR FOR (SELECT g.genre, SUM(o.played_time), count(DISTINCT ga.game_id), AVG(ga.popularity)
 FROM owns as o JOIN genres as g ON (o.game_id = g.game_id) JOIN games as ga ON (o.game_id = ga.game_id) WHERE o.user_id = userid
 GROUP BY g.genre
 ORDER BY SUM(o.played_time) DESC);
 DECLARE CONTINUE HANDLER FOR NOT FOUND SET exit_loop = TRUE;

 DROP TABLE IF EXISTS statistics1;
 CREATE TABLE statistics1 (
     genre VARCHAR(255),
     play_time INT,
     num_game INT,
     avg_pop INT,
     fan_level VARCHAR(255),
     PRIMARY KEY (genre)
 );

 DROP TABLE IF EXISTS statistics2;
 CREATE TABLE statistics2 (
     genre VARCHAR(255),
     game_id INT,
     game_name VARCHAR(255),
     popularity INT
 );

 OPEN custCur;
   cloop: LOOP
   FETCH custCur INTO genre, play_time, num_game, avg_pop;
   IF exit_loop THEN
       LEAVE cloop;
   END IF;

   IF (num_game >= 0 AND num_game <= 1) THEN
       SET fan_level = "LOW FAN";
   ELSEIF (num_game > 1 AND num_game <= 2) THEN
       SET fan_level = "MEDIUM FAN";
   ELSE
       SET fan_level = "HIGH FAN";
   END IF;

   INSERT INTO statistics1 VALUES(genre, play_time, num_game, avg_pop, fan_level);

   END LOOP cloop;
   CLOSE custCur;

 INSERT INTO statistics2 (genre, game_id, game_name, popularity)
 SELECT gs.genre, g1.game_id, g1.name, g1.popularity
 FROM games as g1 JOIN genres as gs ON (g1.game_id = gs.game_id) WHERE (gs.genre, g1.popularity) IN (SELECT g.genre, MAX(ga.popularity)
 FROM games as ga JOIN genres as g ON (ga.game_id = g.game_id) GROUP BY g.genre)
 ORDER BY g1.popularity DESC;
END;
DELIMITER ;
