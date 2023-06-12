CREATE TRIGGER FavoriteGenre
   AFTER INSERT ON owns
   FOR EACH ROW
   BEGIN
       SET @curr_genre = (SELECT genre FROM games NATURAL JOIN genres WHERE game_id = NEW.game_id LIMIT 1);
       SET @num_games = (SELECT COUNT(DISTINCT(genres.game_id)) FROM owns NATURAL JOIN genres WHERE user_id = NEW.user_id and genre = @curr_genre);
       IF (@curr_genre IS NOT NULL AND @num_games >= 2) THEN
           INSERT INTO recommend(user_id, genre) VALUES(NEW.user_id, @curr_genre) ON DUPLICATE KEY UPDATE genre = genre;
       END IF;
   END;