const btnAdd = document.getElementById('btnAdd');
const modalEl = document.getElementById('modalAdd');
const bsModal = new bootstrap.Modal(modalEl);
const saveAdd = document.getElementById('saveAdd');
const closeAdd = document.getElementById('closeAdd');
const frmAdd = document.getElementById('frmAdd');
const btnImport = document.getElementById('btnImport');
const btnViewAll = document.getElementById('btnViewAll');
const fileInput = document.getElementById('fileInput');
const btnFilter = document.getElementById('btnFilter');
const customerSelect = document.getElementById('customerSelect');
const fromInput = document.getElementById('from');
const toInput = document.getElementById('to');
const btnToggleFilters = document.getElementById('btnToggleFilters');
const filtersDiv = document.getElementById('filters');
const tblBody = document.querySelector('#tbl tbody');
const sumSacks = document.getElementById('sumSacks');
const sumWeight = document.getElementById('sumWeight');
const sumTotalWeight = document.getElementById('sumTotalWeight');
const sumPieces = document.getElementById('sumPieces');
const sumAmount = document.getElementById('sumAmount');
const sumTotalAmount = document.getElementById('sumTotalAmount');
const recIdInput = document.getElementById('recId');
const btnExport = document.getElementById('btnExport');

btnAdd.addEventListener('click', () => bsModal.show());
closeAdd.addEventListener('click', () => bsModal.hide());

saveAdd.addEventListener('click', async () => {
  const data = Object.fromEntries(new FormData(frmAdd));
  // if id present -> update
  if (data.id) {
    const id = data.id;
    delete data.id;
    await fetch('/api/sales/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  } else {
    await fetch('/api/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  }
  bsModal.hide();
  frmAdd.reset();
  recIdInput.value = '';
  loadTable();
  loadCustomers();
});

btnImport.addEventListener('click', async () => {
  if (!fileInput.files || fileInput.files.length === 0) { alert('Chọn file trước'); return; }
  const f = fileInput.files[0];
  const fd = new FormData();
  fd.append('file', f);
  const res = await fetch('/api/import', { method: 'POST', body: fd });
  const j = await res.json();
  if (j.error) {
    alert('Lỗi khi import: ' + j.error);
  } else {
    alert(`Import xong. Tổng: ${j.total || 0}, Thêm: ${j.inserted || 0}, Bỏ qua (trùng): ${j.skipped || 0}`);
  }
  loadTable();
  loadCustomers();
});

btnViewAll.addEventListener('click', () => {
  customerSelect.value = '';
  fromInput.value = '';
  toInput.value = '';
  loadTable();
});

btnFilter.addEventListener('click', () => loadTable());

btnExport.addEventListener('click', async () => {
  const params = new URLSearchParams();
  if (customerSelect.value) params.set('customer', customerSelect.value);
  if (fromInput.value) params.set('from', fromInput.value);
  if (toInput.value) params.set('to', toInput.value);
  const url = '/api/export?' + params.toString();
  window.location = url;
});

function formatNumber(n) {
  if (n === null || n === undefined || n === '') return '';
  const num = Number(n) || 0;
  // Vietnamese style: dot as thousands separator, comma as decimal
  return num.toLocaleString('de-DE');
}

async function loadTable() {
  const params = new URLSearchParams();
  if (customerSelect.value) params.set('customer', customerSelect.value);
  if (fromInput.value) params.set('from', fromInput.value);
  if (toInput.value) params.set('to', toInput.value);
  const res = await fetch('/api/sales?' + params.toString());
  const rows = await res.json();
  tblBody.innerHTML = '';
  // compute totals
  let totalSacks = 0, totalWeight = 0, totalTotalWeight = 0, totalPieces = 0, totalAmount = 0, totalTotalAmount = 0;
  for (const r of rows) {
    const tr = document.createElement('tr');
    const displayDate = formatDateForDisplay(r.date);
    tr.innerHTML = `
      <td>${r.customer_name||''}</td>
      <td>${displayDate||''}</td>
      <td>${r.sacks||0}</td>
      <td>${r.weight||0}</td>
      <td>${r.total_weight||0}</td>
      <td>${r.pieces||0}</td>
      <td>${r.unit_price||0}</td>
      <td>${formatNumber(r.amount)}</td>
      <td>${formatNumber(r.total_amount)}</td>
      <td>${r.note||''}</td>
      <td><div class="action-btns"><button class="btn btn-sm btn-outline-primary btn-edit" data-id="${r.id}">Sửa</button><button class="btn btn-sm btn-outline-danger btn-del" data-id="${r.id}">Xóa</button></div></td>
    `;
    tblBody.appendChild(tr);
    totalSacks += Number(r.sacks||0);
    totalWeight += Number(r.weight||0);
    totalTotalWeight += Number(r.total_weight||0);
    totalPieces += Number(r.pieces||0);
    totalAmount += Number(r.amount||0);
    totalTotalAmount += Number(r.total_amount||0);
  }
  // set footer totals
  sumSacks.textContent = totalSacks;
  sumWeight.textContent = totalWeight;
  sumTotalWeight.textContent = totalTotalWeight;
  sumPieces.textContent = totalPieces;
  sumAmount.textContent = formatNumber(totalAmount);
  sumTotalAmount.textContent = formatNumber(totalTotalAmount);
}

// format date YYYY-MM-DD -> dd/mm/yyyy for display
function formatDateForDisplay(d) {
  if (!d) return '';
  // if already dd/mm, return as-is
  if (typeof d === 'string' && d.match(/^\d{2}\/\d{2}\/\d{4}$/)) return d;
  // if ISO date string YYYY-MM-DD or with time YYYY-MM-DDTHH:MM..., extract date parts directly
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    const y = d.slice(0,4);
    const m = d.slice(5,7);
    const day = d.slice(8,10);
    return `${day}/${m}/${y}`;
  }
  // fallback to Date parsing for other formats
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = dt.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// handle edit/delete via event delegation
tblBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  if (btn.classList.contains('btn-del')) {
    if (!confirm('Xác nhận xóa bản ghi này?')) return;
    await fetch('/api/sales/' + id, { method: 'DELETE' });
    loadTable();
    loadCustomers();
  } else if (btn.classList.contains('btn-edit')) {
    // find the row data by fetching list from server and populate modal safely
    const res = await fetch('/api/sales');
    const rows = await res.json();
    const rec = rows.find(r => String(r.id) === String(id));
    if (!rec) return alert('Không tìm thấy bản ghi');
    // helper to set form element safely
    const setVal = (name, value) => { if (frmAdd.elements[name]) frmAdd.elements[name].value = value; };

    setVal('customer_code', rec.customer_code || '');
    setVal('customer_name', rec.customer_name || '');

    // normalize various date representations into yyyy-mm-dd for date input
    let inputDate = '';
    if (rec.date) {
      if (typeof rec.date === 'string') {
        // ISO strings like 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM:SSZ'
        if (/^\d{4}-\d{2}-\d{2}$/.test(rec.date)) {
          inputDate = rec.date;
        } else if (/^\d{4}-\d{2}-\d{2}T/.test(rec.date)) {
          inputDate = rec.date.slice(0, 10);
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rec.date)) {
          const dparts = rec.date.split('/'); inputDate = `${dparts[2]}-${dparts[1]}-${dparts[0]}`;
        } else {
          // try Date parse
            const dt = new Date(rec.date);
            if (!isNaN(dt)) {
              inputDate = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
          }
        }
      } else if (rec.date instanceof Object && typeof rec.date.getFullYear === 'function') {
        const dt = rec.date;
        // use UTC parts to avoid local timezone offset
        inputDate = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
      }
    }
    setVal('date', inputDate);

    setVal('sacks', rec.sacks || 0);
    setVal('weight', rec.weight || 0);
    setVal('total_weight', rec.total_weight || 0);
    setVal('pieces', rec.pieces || 0);
    setVal('unit_price', rec.unit_price || 0);
    setVal('amount', rec.amount || 0);
    setVal('total_amount', rec.total_amount || 0);
    setVal('note', rec.note || '');
    recIdInput.value = rec.id;
    bsModal.show();
  }
});

async function loadCustomers() {
  // use customer_name for filter (unique names)
  const res = await fetch('/api/sales');
  const rows = await res.json();
  const map = new Map();
  for (const r of rows) {
    const name = (r.customer_name || '').trim();
    if (name && !map.has(name)) map.set(name, true);
  }
  const prev = customerSelect.value;
  customerSelect.innerHTML = '<option value="">-- Khách hàng --</option>';
  for (const name of map.keys()) {
    const opt = document.createElement('option'); opt.value = name; opt.textContent = name; if (name===prev) opt.selected = true; customerSelect.appendChild(opt);
  }
}

// init
loadCustomers();
loadTable();

// toggle filters on small screens
if (btnToggleFilters && filtersDiv) {
  btnToggleFilters.addEventListener('click', () => {
    // on small screens, show/hide filters
    if (filtersDiv.classList.contains('d-none')) {
      filtersDiv.classList.remove('d-none');
      filtersDiv.classList.add('d-flex');
      btnToggleFilters.textContent = 'Bộ lọc ▴';
    } else {
      filtersDiv.classList.add('d-none');
      filtersDiv.classList.remove('d-flex');
      btnToggleFilters.textContent = 'Bộ lọc ▾';
    }
  });
}
