-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 16, 2025 lúc 06:01 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `quanly`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sales`
--

CREATE TABLE `sales` (
  `id` int(11) NOT NULL,
  `customer_code` varchar(255) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `sacks` double DEFAULT NULL,
  `weight` double DEFAULT NULL,
  `total_weight` double DEFAULT NULL,
  `pieces` int(11) DEFAULT NULL,
  `unit_price` double DEFAULT NULL,
  `amount` double DEFAULT NULL,
  `total_amount` double DEFAULT NULL,
  `note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `sales`
--

INSERT INTO `sales` (`id`, `customer_code`, `customer_name`, `date`, `sacks`, `weight`, `total_weight`, `pieces`, `unit_price`, `amount`, `total_amount`, `note`) VALUES
(194, 'KH001', 'Thế Đức', '2025-06-15', 99, 54, 5369, 1150, 33, 37950, 203753550, ''),
(195, 'KH001', 'Thế Đức', '2025-06-18', 103, 16, 1667, 790, 37, 29230, 48726410, ''),
(196, 'KH001', 'Thế Đức', '2025-06-19', 88, 70, 5883, 1200, 33, 39600, 232966800, ''),
(197, 'KH001', 'Thế Đức', '2025-06-19', 22, 70, 1562, 650, 43, 27950, 43657900, ''),
(198, 'KH001', 'Thế Đức', '2025-07-06', 89, 70, 6319, 1050, 34, 35700, 225588300, ''),
(199, 'KH001', 'Thế Đức', '2025-07-06', 39, 70, 2769, 590, 43, 25370, 70249530, ''),
(200, 'KH001', 'Thế Đức', '2025-07-07', 84, 70, 5964, 1000, 35, 35000, 208740000, ''),
(201, 'KH001', 'Thế Đức', '2025-07-07', 9, 70, 639, 580, 43, 24940, 15936660, ''),
(202, 'KH001', 'Thế Đức', '2025-07-10', 166, 60, 9960, 1000, 35, 35000, 348600000, 'Đã thu'),
(203, 'KH001', 'Thế Đức', '2025-08-05', 65, 70, 4637, 960, 34, 32640, 151351680, '4637'),
(204, 'KH001', 'Thế Đức', '2025-08-06', 63, 0, 4481, 900, 34, 30600, 137118600, ''),
(205, 'KH001', 'Thế Đức', '2025-08-07', 62, 0, 4300, 950, 34, 32300, 138890000, '53'),
(206, 'KH001', 'Thế Đức', '2025-08-08', 100, 65, 6500, 900, 34, 30600, 198900000, ''),
(207, 'KH001', 'Thế Đức', '2025-08-09', 69, 66, 4525, 900, 34, 30600, 138465000, ''),
(212, 'KH002', 'Cô Thê', '2025-09-02', 125, 65, 8125, 700, 40, 28000, 227500000, ''),
(213, 'KH002', 'Cô Thê', '2025-09-03', 95, 70, 6745, 750, 40, 30000, 202350000, ''),
(214, 'KH002', 'Cô Thê', '2025-09-04', 78, 70, 5538, 700, 40, 28000, 155064000, ''),
(215, 'KH002', 'Cô Thê', '2025-09-05', 86, 70, 6107, 700, 40, 28000, 170996000, '');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=216;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
