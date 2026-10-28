USE umc_movie;

-- Login is outside Week05: these are non-login dummy values, never real passwords.
INSERT INTO member (email, password, nickname) VALUES
('noco@umc.com', '$2a$10$dummyEncodedPasswordValue', '수현'),
('minseo@umc.com', '$2a$10$dummyEncodedPasswordValue', '민서');

INSERT INTO rating (member_id, movie_id, score, comment, created_at, updated_at) VALUES
(1, 550, 5, '최고의 영화!', '2026-10-28 10:00:00', '2026-10-28 10:00:00'),
(1, 155, 4, '다시 봐도 명작', '2026-10-28 11:00:00', '2026-10-28 11:00:00'),
(2, 550, 3, '호불호가 갈릴 것 같아요', '2026-10-28 12:00:00', '2026-10-28 12:00:00');
