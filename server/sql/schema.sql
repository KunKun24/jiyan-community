-- 极验社区 基础表结构
-- 执行：mysql -ushequ -p'***' -h127.0.0.1 shequ < server/sql/schema.sql

CREATE TABLE IF NOT EXISTS `users` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(32)  NOT NULL COMMENT '用户名，支持中文',
  `email`         VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `avatar`        VARCHAR(255) DEFAULT NULL,
  `role`          ENUM('user','admin') NOT NULL DEFAULT 'user',
  `status`        TINYINT NOT NULL DEFAULT 1 COMMENT '1 正常 0 禁用',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_codes` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`      VARCHAR(190) NOT NULL,
  `purpose`    VARCHAR(16)  NOT NULL DEFAULT 'register' COMMENT 'register / reset / bind',
  `code_hash`  CHAR(64)     NOT NULL COMMENT 'sha256(code|email|purpose)',
  `ip`         VARBINARY(16) DEFAULT NULL,
  `expires_at` DATETIME     NOT NULL,
  `used`       TINYINT      NOT NULL DEFAULT 0,
  `attempts`   INT          NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lookup` (`email`, `purpose`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
