# Quản lý doanh số (Sales Management)

Simple Node.js app to import/export sales data from/to Excel and view/filter data.

Getting started


1. Install dependencies

```powershell
npm install
```

2. Configure MySQL (optional)

By default the app will try to connect to a MySQL server at localhost with user `root`, empty password and database `quanly`.
You can override these with environment variables:

- `DB_HOST` (default: 127.0.0.1)
- `DB_USER` (default: root)
- `DB_PASSWORD` (default: empty)
- `DB_NAME` (default: quanly)

3. Run migration to create database/table

```powershell
# run migration which will create database and table if missing
node server/migrate.js
```

4. Start the server

```powershell
npm start
```

Open http://localhost:3000

Download or generate Excel template
- You can download a ready-made template from the running server at: http://localhost:3000/api/template
- Or generate a local file `client/template.xlsx` by running:

```powershell
node server/generate_template.js
```

The template contains headers (Vietnamese) and a sample row. Date fields accept ISO (YYYY-MM-DD), Excel serial numbers, or common formats like DD/MM/YYYY.

Features
- Thêm thủ công (popup)
- Import dữ liệu từ file Excel (tự map cột có header tiếng Việt hoặc English)
- Lọc theo khách hàng và khoảng thời gian
- Xuất bảng hiện tại ra Excel

Notes
- Database: SQLite (file data/sales.db)
- Excel handling: uses `xlsx` package
