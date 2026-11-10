-- 极验社区 论坛表结构（板块 / 帖子 / 回复）
-- 执行：mysql -ushequ -p'***' -h127.0.0.1 shequ < server/sql/forum.sql

CREATE TABLE IF NOT EXISTS `categories` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(32)  NOT NULL,
  `slug`        VARCHAR(32)  NOT NULL,
  `description` VARCHAR(200) DEFAULT NULL,
  `sort`        INT NOT NULL DEFAULT 0,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `posts` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id`   INT UNSIGNED NOT NULL,
  `user_id`       BIGINT UNSIGNED NOT NULL,
  `title`         VARCHAR(120) NOT NULL,
  `content`       MEDIUMTEXT NOT NULL,
  `views`         INT UNSIGNED NOT NULL DEFAULT 0,
  `reply_count`   INT UNSIGNED NOT NULL DEFAULT 0,
  `last_reply_at` DATETIME DEFAULT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cat_created` (`category_id`, `created_at`),
  KEY `idx_created` (`created_at`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `replies` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id`    BIGINT UNSIGNED NOT NULL,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `content`    TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post_created` (`post_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `categories` (`name`, `slug`, `description`, `sort`) VALUES
  ('综合讨论', 'general', '什么都聊，欢迎开新帖。', 10),
  ('技术分享', 'tech',    '代码、工具、踩坑记录。', 20),
  ('闲聊灌水', 'chat',    '不赶时间的话，来坐坐。', 30),
  ('站务反馈', 'meta',    '关于社区本身的建议和问题。', 40);
