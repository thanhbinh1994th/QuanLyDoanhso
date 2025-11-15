const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const out = path.join(__dirname, '..', 'client', 'template.xlsx');

const headers = [
  'Mã Khách hàng', 'Tên khách hàng', 'Ngày tháng', 'Số bao', 'Khối lượng', 'Tổng khối lượng', 'Số con', 'Đơn giá', 'Thành tiền', 'Tổng tiền', 'Ghi chú'
];

const sample = {
  'Mã Khách hàng': 'KH001',
  'Tên khách hàng': 'Công ty ABC',
  'Ngày tháng': '2025-11-15',
  'Số bao': 10,
  'Khối lượng': 250.5,
  'Tổng khối lượng': 250.5,
  'Số con': 1000,
  'Đơn giá': 2.5,
  'Thành tiền': 250.5 * 2.5,
  'Tổng tiền': 250.5 * 2.5,
  'Ghi chú': 'Mẫu'
};

function generate() {
  const ws = xlsx.utils.json_to_sheet([sample], { header: headers });
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Template');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  // ensure client dir
  const dir = path.dirname(out);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(out, buf);
  console.log('Template generated at', out);
}

if (require.main === module) generate();

module.exports = { generate };
