-- 선수 데이터 추가
-- 해당 코드 new query에 삽입하고 mysql run
INSERT INTO Players (name, height, weight, speed, acceleration, shootingFinish, shootingPower, pass, defense, stamina, agility, balance, gk, createdAt, updatedAt)
VALUES
('리오넬 메수', 170, 72, 93, 92, 99, 90, 98, 52, 82, 99, 99, 5, NOW(), NOW()),
('아라비안 나잇두', 187, 83, 94, 95, 97, 99, 70, 73, 91, 90, 89, 77, NOW(), NOW()),
('닌자 거북이', 178, 73, 97, 98, 96, 91, 85, 62, 96, 99, 95, 51, NOW(), NOW()),
('레오나르도 홀카프리오', 195, 94, 98, 96, 96, 99, 76, 63, 90, 83, 92, 79, NOW(), NOW()),
('푸른심장 램파드', 184, 89, 90, 91, 94, 95, 97, 89, 98, 89, 95, 81, NOW(), NOW()),
('훔바훔바 제라드', 183, 83, 89, 91, 88, 96, 95, 91, 97, 81, 85, 76, NOW(), NOW()),
('디디에 드록신', 189, 88, 90, 91, 95, 99, 71, 72, 85, 79, 90, 82, NOW(), NOW()),
('페트르 최흐', 196, 90, 69, 80, 66, 75, 80, 73, 88, 89, 93, 98, NOW(), NOW());

SELECT * FROM Players