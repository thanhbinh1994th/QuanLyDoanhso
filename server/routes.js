const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');
const db = require('./db');

const upload = multer({ dest: 'uploads/' });

// Helper: parse various date representations into YYYY-MM-DD or null
function parseDate(val) {
  if (!val && val !== 0) return null;
  // Excel serial number (days since 1899-12-30)
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  // If already a Date object
  if (val instanceof Date) {
    if (isNaN(val)) return null;
    return val.toISOString().slice(0, 10);
  }
  // String: if matches numeric D/M/Y form, treat strictly as dd/mm/yyyy (user says Excel always uses dd/mm/yyyy)
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return null;
    // match numeric date formats D/M/YYYY (allow 1-2 digits for day/month, 2-4 for year)
    const dm = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dm) {
      // Per user's instruction: always treat as dd/mm/yyyy
      const day = parseInt(dm[1], 10);
      const month = parseInt(dm[2], 10);
      let year = dm[3];
      if (year.length === 2) {
        const y = parseInt(year, 10);
        year = (y < 50 ? 2000 + y : 1900 + y).toString();
      }
      if (day < 1 || day > 31 || month < 1 || month > 12) return null;
      const dd = String(day).padStart(2, '0');
      const mm = String(month).padStart(2, '0');
      const iso = `${year}-${mm}-${dd}`; // YYYY-MM-DD
      const parsed = new Date(iso);
      if (!isNaN(parsed)) return iso;
    }
    // fallback: try parsing ISO or other recognized formats
    const parsed2 = new Date(s);
    if (!isNaN(parsed2)) return parsed2.toISOString().slice(0, 10);
  }
  return null;
}

// Helper to map row object to DB columns and normalize types
function mapRow(r) {
  const rawDate = r['Ngày tháng'] || r.date || '';
  const date = parseDate(rawDate);

  return {
    customer_code: r['Mã Khách hàng'] || r.customer_code || r.code || r['Code'] || '',
    customer_name: r['Tên khách hàng'] || r.customer_name || r.name || r['Name'] || '',
    date: date,
    sacks: Number(r['Số bao'] || r.sacks || 0) || 0,
    weight: Number(r['Khối lượng'] || r.weight || 0) || 0,
    total_weight: Number(r['Tổng khối lượng'] || r.total_weight || 0) || 0,
    pieces: Number(r['Số con'] || r.pieces || 0) || 0,
    unit_price: Number(r['Đơn giá'] || r.unit_price || 0) || 0,
    amount: Number(r['Thành tiền'] || r.amount || 0) || 0,
    total_amount: Number(r['Tổng tiền'] || r.total_amount || 0) || 0,
    note: r['Ghi chú'] || r.note || ''
  };
}

// Add manual entry
router.post('/api/add', express.json(), async (req, res) => {
  try {
    const v = mapRow(req.body);
    const id = await db.add(v);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a sale
router.put('/api/sales/:id', express.json(), async (req, res) => {
  try {
    const id = req.params.id;
    const v = mapRow(req.body);
    const affected = await db.update(id, v);
    res.json({ success: true, affected });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a sale
router.delete('/api/sales/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const affected = await db.remove(id);
    res.json({ success: true, affected });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import from Excel
router.post('/api/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const wb = xlsx.readFile(req.file.path);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    const mapped = rows.map(mapRow);
    const result = await db.addMany(mapped);
    // result: { inserted, skipped }
    res.json({ success: true, inserted: result.inserted, skipped: result.skipped, total: mapped.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sales with optional filters
router.get('/api/sales', async (req, res) => {
  try {
    const { customer, from, to } = req.query;
    const rows = await db.query({ customer, from, to });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly revenue grouped by month (YYYY-MM)
router.get('/api/monthly', async (req, res) => {
  try {
    const { year } = req.query;
    const rows = await db.monthly(year);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export current table to a styled Excel that matches the requested layout
router.get('/api/export', async (req, res) => {
  try {
    const { customer, from, to } = req.query;
    const rows = await db.query({ customer, from, to });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Báo cáo');

    // Columns layout matching sample (order and keys)
    ws.columns = [
      { header: 'Ngày tháng', key: 'date', width: 14 },
      { header: 'Số bao', key: 'sacks', width: 8 },
      { header: 'Số Kg', key: 'weight', width: 10 },
      { header: 'Tổng lượng', key: 'total_weight', width: 12 },
      { header: 'Số con', key: 'pieces', width: 8 },
      { header: 'Đơn giá', key: 'unit_price', width: 10 },
      { header: 'Thành tiền', key: 'amount', width: 14 },
      { header: 'Tổng Tiền', key: 'total_amount', width: 16 },
      { header: 'Ghi chú', key: 'note', width: 20 }
    ];

    // Title (merge first 9 columns)
    ws.mergeCells('A1:I1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'BÁO CÁO DOANH SỐ';
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.font = { size: 16, bold: true };

    // Subtitle (date range) on row 2 — format to dd/mm/yyyy if possible
    function fmtRangeDate(s) {
      if (!s) return '....';
      // accept YYYY-MM-DD or DD/MM/YYYY or other parseable
      if (typeof s === 'string' && s.includes('-')) {
        const p = s.split('-');
        if (p.length === 3) return `${p[2].padStart(2,'0')}/${p[1].padStart(2,'0')}/${p[0]}`;
      }
      if (typeof s === 'string' && s.includes('/')) {
        // assume already dd/mm/yyyy
        return s;
      }
      const dt = new Date(s);
      if (!isNaN(dt)) {
        const dd = String(dt.getDate()).padStart(2, '0');
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const yyyy = dt.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      }
      return String(s);
    }

    ws.mergeCells('A2:I2');
    const sub = ws.getCell('A2');
    const fromLabel = fmtRangeDate(from);
    const toLabel = fmtRangeDate(to);
    sub.value = `(Từ ${fromLabel} Đến ${toLabel})`;
    sub.alignment = { horizontal: 'center' };

    // Customer name row on row 3
    ws.getCell('A4').value = 'Tên khách';
    ws.getCell('B4').value = customer || 'Tổng hợp';
    ws.getCell('B4').font = { bold: true };
    // header row starts at row 6 (matching sample spacing)
    const headerRowIndex = 6;
    const headerRow = ws.getRow(headerRowIndex);
    // write headers
    const headers = ['Ngày tháng', 'Số bao', 'Số Kg', 'Tổng lượng', 'Số con', 'Đơn giá', 'Thành tiền', 'Tổng Tiền', 'Ghi chú'];
    for (let i = 0; i < headers.length; i++) {
      const cell = headerRow.getCell(i + 1);
      cell.value = headers[i];
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB9E6B8' } }; // light green
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center' };
    }

    // start adding data from next row
    let currentRow = headerRowIndex + 1;
    for (const r of rows) {
      const row = ws.getRow(currentRow);
      // date: convert to Date object if possible
      let dateVal = null;
      if (r.date) {
        if (r.date instanceof Date) {
          // create UTC midnight to avoid timezone shifts when writing to Excel
          dateVal = new Date(Date.UTC(r.date.getFullYear(), r.date.getMonth(), r.date.getDate()));
        } else {
          // try YYYY-MM-DD or other string
          const s = String(r.date);
          const parts = s.split('-');
          if (parts.length === 3) {
            // parts[2] may contain time (ISO). extract only day number
            const year = Number(parts[0]);
            const month = Number(parts[1]);
            // parts[2] can be 'DD' or 'DDTHH:..' so extract leading digits
            const dayMatch = parts[2].match(/^(\d{1,2})/);
            const day = dayMatch ? Number(dayMatch[1]) : NaN;
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
              dateVal = new Date(Date.UTC(year, month - 1, day));
            }
          } else {
            const parsed = new Date(s);
            if (!isNaN(parsed)) dateVal = new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
          }
        }
      }
      row.getCell(1).value = dateVal;
      row.getCell(1).numFmt = 'dd/mm/yyyy';
  row.getCell(2).value = Number(r.sacks || 0);
  row.getCell(3).value = Number(r.weight || 0);
  row.getCell(4).value = Number(r.total_weight || 0);
  row.getCell(5).value = Number(r.pieces || 0);
  row.getCell(6).value = Number(r.unit_price || 0);
  row.getCell(7).value = Number(r.amount || 0);
  row.getCell(8).value = Number(r.total_amount || 0);
  row.getCell(9).value = r.note || '';

      // apply number formats
  row.getCell(2).numFmt = '#,##0';
  row.getCell(3).numFmt = '#,##0';
  row.getCell(4).numFmt = '#,##0';
  row.getCell(5).numFmt = '#,##0';
  row.getCell(6).numFmt = '#,##0';
  row.getCell(7).numFmt = '#,##0';
  row.getCell(8).numFmt = '#,##0';

      // optional green fill for rows (light banding)
      const fillColor = (currentRow % 2 === 0) ? 'FFEAF6EA' : 'FFFFFFFF';
      for (let c = 1; c <= 9; c++) {
        ws.getRow(currentRow).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      }

      currentRow++;
    }

    // totals row
    const totalsRow = ws.getRow(currentRow);
    totalsRow.getCell(1).value = 'TỔNG';
    totalsRow.getCell(2).value = { formula: `SUM(B${headerRowIndex + 1}:B${currentRow - 1})` };
    totalsRow.getCell(3).value = { formula: `SUM(C${headerRowIndex + 1}:C${currentRow - 1})` };
    totalsRow.getCell(4).value = { formula: `SUM(D${headerRowIndex + 1}:D${currentRow - 1})` };
    totalsRow.getCell(5).value = { formula: `SUM(E${headerRowIndex + 1}:E${currentRow - 1})` };
    totalsRow.getCell(7).value = { formula: `SUM(G${headerRowIndex + 1}:G${currentRow - 1})` };
    totalsRow.getCell(8).value = { formula: `SUM(H${headerRowIndex + 1}:H${currentRow - 1})` };

    // style totals row
    totalsRow.font = { bold: true, color: { argb: 'FFFF0000' } };
    for (let c = 1; c <= 9; c++) {
      totalsRow.getCell(c).border = { top: { style: 'thin' } };
    }
    totalsRow.getCell(2).numFmt = '#,##0';
    totalsRow.getCell(3).numFmt = '#,##0';
    totalsRow.getCell(4).numFmt = '#,##0';
    totalsRow.getCell(5).numFmt = '#,##0';
    totalsRow.getCell(7).numFmt = '#,##0';
    totalsRow.getCell(8).numFmt = '#,##0';

    // finalize workbook
    // set print area or view options if needed
    const buf = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Provide an Excel template for download (generated on-the-fly)
router.get('/api/template', (req, res) => {
  try {
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
    const ws = xlsx.utils.json_to_sheet([sample], { header: headers });
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Template');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

