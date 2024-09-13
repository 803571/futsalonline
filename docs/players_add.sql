-- 선수 데이터 추가
-- 해당 코드 new query에 삽입하고 mysql run
INSERT INTO Players (name, speed, shootingFinish, shootingPower, stamina, defense, createdAt, updatedAt)
VALUES
('Player1', 0, 0, 0, 0, 0, NOW(), NOW()),
('Player2', 0, 0, 0, 0, 0, NOW(), NOW()),
('Player3', 0, 0, 0, 0, 0, NOW(), NOW());

SELECT * FROM Players