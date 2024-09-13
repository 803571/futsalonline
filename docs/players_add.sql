-- 선수 데이터 추가
-- 해당 코드 new query에 삽입하고 mysql run
INSERT INTO Players (name, speed, shootingFinish, shootingPower, stamina, defense, createdAt, updatedAt)
VALUES
('Player 1', 90, 85, 80, 75, 70, NOW(), NOW()),
('Player 2', 85, 80, 85, 70, 75, NOW(), NOW()),
('Player 3', 88, 78, 82, 77, 72, NOW(), NOW());

SELECT * FROM Players