-- 선수 데이터 추가
-- 해당 코드 new query에 삽입하고 mysql run
INSERT INTO Players (name, height, weight, PAC, SHO, PAS, DRI, DEF, PHY, createdAt, updatedAt)
VALUES
('리오넬 메수', 170, 72, 90, 96, 98, 99, 51, 81, NOW(), NOW()),
('아라비안 나잇두', 187, 83, 96, 98, 93, 89, 68, 96, NOW(), NOW()),
('닌자 거북이', 178, 73, 98, 92, 89, 92, 74, 90, NOW(), NOW()),
('레오나르도 홀카프리오', 195, 94, 97, 93, 81, 83, 76, 98, NOW(), NOW()),
('푸른심장 램파드', 184, 89, 87, 95, 96, 90, 86, 93, NOW(), NOW()),
('훔바훔바 제라드', 183, 83, 85, 94, 96, 82, 90, 92, NOW(), NOW()),
('디디에 드록신', 189, 88, 89, 97, 72, 75, 73, 99, NOW(), NOW())

SELECT * FROM Players
