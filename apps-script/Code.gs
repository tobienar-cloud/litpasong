/**
 * ລະບົບສັ່ງຊື້ຄຳອອນລາຍ ຮ້ານຄຳ ລິດປະສົງ (Litpasong Jewelry)
 * Google Apps Script — ວາງໃນ Google Sheet ລາຄາຄຳ (Extensions → Apps Script)
 *
 * ໜ້າເວັບ https://tobienar-cloud.github.io/litpasong/order.html ສົ່ງຄຳສັ່ງຊື້ມາທີ່ນີ້.
 * ລາຄາຄິດໄລ່ຈາກຊີດ "ชีต1" ສະເໝີ ລູກຄ້າແກ້ລາຄາເອງບໍ່ໄດ້.
 */

// ---------- ການຕັ້ງຄ່າ ----------
const CFG = {
  PRICE_SHEET: 'ชีต1',
  PRICE_RANGE: 'A5:C17',
  ORDER_SHEET: 'ຄຳສັ່ງຊື້',
  SLIP_FOLDER: 'ສະລິບໂອນເງິນ Litpasong',
  NOTIFY_EMAIL: '',            // ອີເມວແຈ້ງເຕືອນບິນໃໝ່ (ວ່າງ = ໃຊ້ອີເມວເຈົ້າຂອງຊີດ)
  ADMIN_WHATSAPP: '+8562097170747', // WhatsApp ແອັດມິນ ຮັບແຈ້ງເຕືອນບິນໃໝ່
  // ກະແຈ CallMeBot ເກັບໃນ Project Settings → Script properties ຊື່ CALLMEBOT_APIKEY (ບໍ່ໃສ່ໃນໂຄດ)
  PAY_MINUTES: 30,             // ລັອກລາຄາ 30 ນາທີ
  STATS_SHEET: 'ສະຖິຕິເຂົ້າເວັບ',
  LATE_SLIP_HOURS: 24,         // ໝົດເວລາແລ້ວ ຍັງແນບສະລິບໄດ້ພາຍໃນ 24 ຊົ່ວໂມງ (ແອັດມິນກວດເວລາໂອນ)
  PICKUP_MONTHS: 3,            // ຮັບຄຳພາຍໃນ 3 ເດືອນ
  MAX_GRAMS: 15,               // ສູງສຸດ 1 ບາດ (15 ກຣາມ) ຕໍ່ບິນ
  TZ: 'Asia/Vientiane',
};

// ນ້ຳໜັກ (ກຣາມ) ຂອງແຕ່ລະແຖວໃນຊີດ: 1 ບາດ = 15 g = 4 ສະຫຼຶງ = 40 ຫຸນ
const ITEMS = {
  '1 ບາດ':                 { name: 'ຄຳຮູບປະພັນ 1 ບາດ',   grams: 15,    kind: 'jewelry' },
  '2 ສະຫຼຶງ':              { name: 'ຄຳຮູບປະພັນ 2 ສະຫຼຶງ', grams: 7.5,   kind: 'jewelry' },
  '1 ສະຫຼຶງ':              { name: 'ຄຳຮູບປະພັນ 1 ສະຫຼຶງ', grams: 3.75,  kind: 'jewelry' },
  '5 ຫຸນ':                 { name: 'ຄຳຮູບປະພັນ 5 ຫຸນ',    grams: 1.875, kind: 'jewelry' },
  '3 ຫຸນ':                 { name: 'ຄຳຮູບປະພັນ 3 ຫຸນ',    grams: 1.125, kind: 'jewelry' },
  '2 ຫຸນ':                 { name: 'ຄຳຮູບປະພັນ 2 ຫຸນ',    grams: 0.75,  kind: 'jewelry' },
  '1 ຫຸນ':                 { name: 'ຄຳຮູບປະພັນ 1 ຫຸນ',    grams: 0.375, kind: 'jewelry' },
  'ຄຳແທ່ງ 1 ກຣາມ':          { name: 'ຄຳແທ່ງ 1 ກຣາມ',       grams: 1,     kind: 'bar' },
  'ລາຄາຂາຍຄຳແທ່ງ 1 ບາດ':    { name: 'ຄຳແທ່ງ 1 ບາດ',        grams: 15,    kind: 'bar' },
};

const STATUS = {
  WAIT_PAY: 'ລໍຖ້າໂອນເງິນ',
  WAIT_CHECK: 'ລໍຖ້າກວດເງິນ',
  READY: 'ຈ່າຍແລ້ວ ພ້ອມຮັບ',
  DONE: 'ຮັບຄຳແລ້ວ',
  CANCEL: 'ຍົກເລີກ',
  EXPIRED: 'ໝົດເວລາໂອນ',
};

const HEAD = ['ເລກບິນ', 'ເວລາສັ່ງ', 'ຊື່ລູກຄ້າ', 'ເບີໂທ', 'ລາຍການ', 'ຈຳນວນ', 'ນ້ຳໜັກ (g)',
  'ລາຄາຕໍ່ໜ່ວຍ (ກີບ)', 'ຍອດໂອນ (ກີບ)', 'ໂອນກ່ອນ', 'ສະລິບ', 'ເວລາແນບສະລິບ',
  'ສະຖານະ', 'ຮັບຄຳພາຍໃນ', 'ໝາຍເຫດແອັດມິນ', 'token', 'pin',
  'ລິ້ງໃບຈອງ', 'ເວລາຢືນຢັນເງິນ', 'ເວລາຮັບຄຳ'];
const SITE = 'https://tobienar-cloud.github.io/litpasong/';
const COL = Object.fromEntries(HEAD.map((h, i) => [h, i + 1]));

// ---------- ຕິດຕັ້ງຄັ້ງດຽວ: ກົດ Run ຟັງຊັນ setup ----------
function setup() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CFG.ORDER_SHEET);
  if (!sh) sh = ss.insertSheet(CFG.ORDER_SHEET);
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold').setBackground('#6e1423').setFontColor('#fbf1df');
  sh.setFrozenRows(1);
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(Object.values(STATUS), true).build();
  sh.getRange(2, COL['ສະຖານະ'], 2000, 1).setDataValidation(rule);
  sh.hideColumns(COL['token']);
  sh.hideColumns(COL['pin']);
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('PIN_SALT')) props.setProperty('PIN_SALT', Utilities.getUuid());
  folder_();
  return 'ok';
}

// ---------- ຈຸດຮັບຄຳຂໍຈາກໜ້າເວັບ ----------
function doGet(e) {
  const p = e.parameter || {};
  try {
    if (p.action === 'items') return json_({ ok: true, items: items_(), rules: rules_() });
    if (p.action === 'order') return json_({ ok: true, order: publicOrder_(find_(p.bill, p.t)) });
    if (p.action === 'hit') return json_(Object.assign({ ok: true }, hit_(p.add === '1')));
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad request' }); }
  try {
    if (body.action === 'create') return json_({ ok: true, order: create_(body) });
    if (body.action === 'slip') return json_({ ok: true, order: slip_(body) });
    if (body.action === 'history') return json_({ ok: true, orders: history_(body) });
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

// ---------- ລາຍການ ແລະ ລາຄາ ----------
function items_() {
  const rows = SpreadsheetApp.getActive().getSheetByName(CFG.PRICE_SHEET).getRange(CFG.PRICE_RANGE).getValues();
  const out = [];
  rows.forEach(r => {
    const label = String(r[0]).trim();
    const info = ITEMS[label];
    const price = Number(String(r[2]).replace(/[^0-9.]/g, ''));
    if (info && price > 0) out.push({ id: label, name: info.name, grams: info.grams, kind: info.kind, price: price });
  });
  return out;
}

function rules_() {
  return { payMinutes: CFG.PAY_MINUTES, pickupMonths: CFG.PICKUP_MONTHS, maxGrams: CFG.MAX_GRAMS };
}

// ---------- ສ້າງບິນ (ລັອກລາຄາ) ----------
function create_(b) {
  const name = clean_(b.name, 80), phone = clean_(b.phone, 30);
  if (!name) throw new Error('ກະລຸນາໃສ່ຊື່');
  if (!/^[0-9+ ()-]{8,20}$/.test(phone) || phone8_(phone).length < 8) throw new Error('ເບີໂທບໍ່ຖືກຕ້ອງ');
  const pin = String(b.pin || '');
  if (!/^[0-9]{6}$/.test(pin)) throw new Error('ລະຫັດ PIN ຕ້ອງເປັນຕົວເລກ 6 ໂຕ');
  const qty = Math.floor(Number(b.qty));
  if (!(qty >= 1 && qty <= 40)) throw new Error('ຈຳນວນບໍ່ຖືກຕ້ອງ');
  const item = items_().find(i => i.id === b.item);
  if (!item) throw new Error('ບໍ່ພົບລາຍການນີ້ ຫຼື ລາຄາຍັງບໍ່ພ້ອມ');
  const grams = Math.round(item.grams * qty * 1000) / 1000;
  if (grams > CFG.MAX_GRAMS + 1e-9) throw new Error('ສັ່ງໄດ້ສູງສຸດ 1 ບາດ (15 ກຣາມ) ຕໍ່ບິນ ຫຼາຍກວ່ານີ້ກະລຸນາທັກແອັດມິນ');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = orders_();
    const now = new Date();
    const day = Utilities.formatDate(now, CFG.TZ, 'yyyyMMdd');
    const prefix = 'LPS-' + day + '-';
    const last = sh.getLastRow();
    let n = 0;
    if (last > 1) {
      sh.getRange(2, 1, last - 1, 1).getValues().forEach(r => {
        const s = String(r[0]);
        if (s.indexOf(prefix) === 0) n = Math.max(n, Number(s.slice(prefix.length)) || 0);
      });
    }
    const bill = prefix + ('000' + (n + 1)).slice(-4);
    const due = new Date(now.getTime() + CFG.PAY_MINUTES * 60000);
    const pickup = new Date(now); pickup.setMonth(pickup.getMonth() + CFG.PICKUP_MONTHS);
    const token = Utilities.getUuid().replace(/-/g, '');
    const row = new Array(HEAD.length).fill('');
    row[COL['ເລກບິນ'] - 1] = bill;
    row[COL['ເວລາສັ່ງ'] - 1] = now;
    row[COL['ຊື່ລູກຄ້າ'] - 1] = name;
    row[COL['ເບີໂທ'] - 1] = "'" + phone;
    row[COL['ລາຍການ'] - 1] = item.name;
    row[COL['ຈຳນວນ'] - 1] = qty;
    row[COL['ນ້ຳໜັກ (g)'] - 1] = grams;
    row[COL['ລາຄາຕໍ່ໜ່ວຍ (ກີບ)'] - 1] = item.price;
    row[COL['ຍອດໂອນ (ກີບ)'] - 1] = item.price * qty;
    row[COL['ໂອນກ່ອນ'] - 1] = due;
    row[COL['ສະຖານະ'] - 1] = STATUS.WAIT_PAY;
    row[COL['ຮັບຄຳພາຍໃນ'] - 1] = pickup;
    row[COL['token'] - 1] = token;
    row[COL['pin'] - 1] = pinHash_(phone, pin);
    row[COL['ລິ້ງໃບຈອງ'] - 1] = SITE + 'order.html?bill=' + bill + '&t=' + token;
    sh.appendRow(row);
    SpreadsheetApp.flush();
    return Object.assign(publicOrder_(find_(bill, token)), { t: token });
  } finally {
    lock.releaseLock();
  }
}

// ---------- ນັບຜູ້ເຂົ້າຊົມເວັບ ----------
// ລວມທັງໝົດເກັບໃນ Script Properties, ລາຍວັນເກັບໃນແຖບ "ສະຖິຕິເຂົ້າເວັບ"
function hit_(add) {
  const props = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd');
  if (!add) {
    return { total: Number(props.getProperty('VISITS_TOTAL') || 0),
             today: props.getProperty('VISITS_DAY') === today ? Number(props.getProperty('VISITS_TODAY') || 0) : 0 };
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return hit_(false);
  try {
    const total = Number(props.getProperty('VISITS_TOTAL') || 0) + 1;
    const day = props.getProperty('VISITS_DAY');
    const todayN = (day === today ? Number(props.getProperty('VISITS_TODAY') || 0) : 0) + 1;
    props.setProperties({ VISITS_TOTAL: String(total), VISITS_DAY: today, VISITS_TODAY: String(todayN) });
    const ss = SpreadsheetApp.getActive();
    let sh = ss.getSheetByName(CFG.STATS_SHEET);
    if (!sh) {
      sh = ss.insertSheet(CFG.STATS_SHEET);
      sh.appendRow(['ວັນທີ', 'ຈຳນວນເຂົ້າເວັບ', 'ລວມທັງໝົດ']);
      sh.setFrozenRows(1);
    }
    const last = sh.getLastRow();
    if (last > 1 && String(sh.getRange(last, 1).getDisplayValue()) === today) {
      sh.getRange(last, 2, 1, 2).setValues([[todayN, total]]);
    } else {
      sh.appendRow(["'" + today, todayN, total]);
    }
    return { total: total, today: todayN };
  } finally {
    lock.releaseLock();
  }
}

// ---------- ແນບສະລິບ ----------
function slip_(b) {
  const o = find_(b.bill, b.t);
  const sh = orders_();
  const status = sh.getRange(o.row, COL['ສະຖານະ']).getValue();
  if (status !== STATUS.WAIT_PAY && status !== STATUS.WAIT_CHECK && status !== STATUS.EXPIRED) throw new Error('ບິນນີ້ແນບສະລິບບໍ່ໄດ້ແລ້ວ (ສະຖານະ: ' + status + ') ຖ້າໂອນເງິນແລ້ວ ກະລຸນາສົ່ງສະລິບທາງ WhatsApp 020 5895 4624');
  const due = sh.getRange(o.row, COL['ໂອນກ່ອນ']).getValue();
  const now = new Date();
  // ແນບຊ້າໄດ້ພາຍໃນ 24 ຊົ່ວໂມງ ແອັດມິນກວດເວລາໂອນໃນສະລິບເອງ
  const late = status !== STATUS.WAIT_CHECK && now > new Date(due.getTime() + 5 * 60000);
  if (late && now > new Date(due.getTime() + CFG.LATE_SLIP_HOURS * 3600000)) {
    sh.getRange(o.row, COL['ສະຖານະ']).setValue(STATUS.EXPIRED);
    throw new Error('ບິນນີ້ໝົດເວລາແນບສະລິບແລ້ວ ຖ້າໂອນເງິນແລ້ວ ກະລຸນາສົ່ງສະລິບທາງ WhatsApp 020 5895 4624');
  }
  const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(String(b.image || ''));
  if (!m) throw new Error('ກະລຸນາແນບຮູບສະລິບ');
  const bytes = Utilities.base64Decode(m[3]);
  if (bytes.length > 4 * 1024 * 1024) throw new Error('ຮູບໃຫຍ່ເກີນໄປ');
  const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
  const file = folder_().createFile(Utilities.newBlob(bytes, m[1], o.bill + '.' + ext));
  sh.getRange(o.row, COL['ສະລິບ']).setValue(file.getUrl());
  sh.getRange(o.row, COL['ເວລາແນບສະລິບ']).setValue(new Date());
  sh.getRange(o.row, COL['ສະຖານະ']).setValue(STATUS.WAIT_CHECK);
  if (late) {
    const nc = sh.getRange(o.row, COL['ໝາຍເຫດແອັດມິນ']);
    nc.setValue(('⚠️ ແນບສະລິບຫຼັງໝົດເວລາລັອກລາຄາ (' + Utilities.formatDate(now, CFG.TZ, 'dd/MM HH:mm') + ') ກວດເວລາໂອນໃນສະລິບ ' + (nc.getValue() || '')).trim());
  }
  notify_(o, file.getUrl(), late);
  return publicOrder_(find_(o.bill, b.t));
}

// ---------- ປະຫວັດການສັ່ງຊື້ (ເບີໂທ + PIN) ----------
function history_(b) {
  const p8 = phone8_(b.phone), pin = String(b.pin || '');
  if (p8.length < 8 || !/^[0-9]{4,6}$/.test(pin)) throw new Error('ກະລຸນາໃສ່ເບີໂທ ແລະ PIN ໃຫ້ຖືກຕ້ອງ');
  const cache = CacheService.getScriptCache(), key = 'fail_' + p8;
  const fails = Number(cache.get(key) || 0);
  if (fails >= 5) throw new Error('ໃສ່ PIN ຜິດຫຼາຍເທື່ອ ກະລຸນາລໍຖ້າ 15 ນາທີ ຫຼື ທັກແອັດມິນ WhatsApp 020 9717 0747');
  const h = pinHash_(p8, pin);
  const sh = orders_(), last = sh.getLastRow();
  const out = [];
  if (last > 1) {
    sh.getRange(2, 1, last - 1, HEAD.length).getValues().forEach((r, i) => {
      if (phone8_(r[COL['ເບີໂທ'] - 1]) === p8 && r[COL['pin'] - 1] === h) {
        const o = rowObj_(r, i + 2);
        out.push(Object.assign(publicOrder_(o), { t: r[COL['token'] - 1] }));
      }
    });
  }
  if (!out.length) {
    cache.put(key, String(fails + 1), 900);
    throw new Error('ບໍ່ພົບຄຳສັ່ງຊື້ ກວດເບີໂທ ແລະ PIN ອີກຄັ້ງ (PIN ແມ່ນລະຫັດທີ່ຕັ້ງຕອນສັ່ງຊື້)');
  }
  cache.remove(key);
  return out.reverse();
}

function phone8_(p) { return String(p || '').replace(/[^0-9]/g, '').slice(-8); }

function pinHash_(phone, pin) {
  const salt = PropertiesService.getScriptProperties().getProperty('PIN_SALT') || 'lps';
  const d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + phone8_(phone) + ':' + pin, Utilities.Charset.UTF_8);
  return d.map(x => ('0' + (x & 255).toString(16)).slice(-2)).join('');
}

// ບັນທຶກເວລາອັດຕະໂນມັດ ເມື່ອແອັດມິນປ່ຽນສະຖານະໃນຊີດ
function onEdit(e) {
  try {
    const sh = e.range.getSheet();
    if (sh.getName() !== CFG.ORDER_SHEET || e.range.getColumn() !== COL['ສະຖານະ'] || e.range.getRow() < 2) return;
    const v = e.range.getValue();
    if (v === STATUS.READY) sh.getRange(e.range.getRow(), COL['ເວລາຢືນຢັນເງິນ']).setValue(new Date());
    if (v === STATUS.DONE) sh.getRange(e.range.getRow(), COL['ເວລາຮັບຄຳ']).setValue(new Date());
  } catch (err) {}
}

// ---------- ຕົວຊ່ວຍ ----------
function orders_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CFG.ORDER_SHEET);
  if (!sh) throw new Error('ລະບົບຍັງບໍ່ໄດ້ຕັ້ງຄ່າ (ແລ່ນ setup ກ່ອນ)');
  return sh;
}

function find_(bill, token) {
  bill = String(bill || ''); token = String(token || '');
  if (!bill || !token) throw new Error('ບໍ່ພົບບິນ');
  const sh = orders_();
  const last = sh.getLastRow();
  if (last < 2) throw new Error('ບໍ່ພົບບິນ');
  const vals = sh.getRange(2, 1, last - 1, HEAD.length).getValues();
  for (let i = vals.length - 1; i >= 0; i--) {
    const r = vals[i];
    if (r[COL['ເລກບິນ'] - 1] === bill && r[COL['token'] - 1] === token) return rowObj_(r, i + 2);
  }
  throw new Error('ບໍ່ພົບບິນ');
}

function rowObj_(r, row) {
  const g = h => r[COL[h] - 1];
  return {
    row: row, bill: g('ເລກບິນ'), created: g('ເວລາສັ່ງ'), name: g('ຊື່ລູກຄ້າ'), phone: String(g('ເບີໂທ')),
    item: g('ລາຍການ'), qty: g('ຈຳນວນ'), grams: g('ນ້ຳໜັກ (g)'), price: g('ລາຄາຕໍ່ໜ່ວຍ (ກີບ)'),
    total: g('ຍອດໂອນ (ກີບ)'), due: g('ໂອນກ່ອນ'), slipAt: g('ເວລາແນບສະລິບ'), status: g('ສະຖານະ'),
    pickup: g('ຮັບຄຳພາຍໃນ'), paidAt: g('ເວລາຢືນຢັນເງິນ'), doneAt: g('ເວລາຮັບຄຳ'),
  };
}

function publicOrder_(o) {
  const f = d => (d instanceof Date) ? Utilities.formatDate(d, CFG.TZ, 'dd/MM/yyyy HH:mm') : '';
  const fd = d => (d instanceof Date) ? Utilities.formatDate(d, CFG.TZ, 'dd/MM/yyyy') : '';
  const phone = String(o.phone).replace(/^'/, '');
  return {
    bill: o.bill, created: f(o.created), name: o.name,
    phone: phone.length > 4 ? phone.slice(0, -4).replace(/[0-9]/g, '•') + phone.slice(-4) : phone,
    item: o.item, qty: o.qty, grams: o.grams, price: o.price, total: o.total,
    due: f(o.due), dueMs: (o.due instanceof Date) ? o.due.getTime() : 0, slipAt: f(o.slipAt),
    late: (o.slipAt instanceof Date) && (o.due instanceof Date) && o.slipAt.getTime() > o.due.getTime() + 5 * 60000,
    status: o.status, pickup: fd(o.pickup), paidAt: f(o.paidAt), doneAt: f(o.doneAt),
    jewelry: String(o.item).indexOf('ຮູບປະພັນ') >= 0,
  };
}

function folder_() {
  const it = DriveApp.getFoldersByName(CFG.SLIP_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CFG.SLIP_FOLDER);
}

function notify_(o, slipUrl, late) {
  const body = (late ? '⚠️ ແນບສະລິບຫຼັງໝົດເວລາລັອກລາຄາ ກວດເວລາໂອນໃນສະລິບ\n' : '') + 'ບິນໃໝ່ລໍຖ້າກວດເງິນ\n\nເລກບິນ: ' + o.bill + '\nລູກຄ້າ: ' + o.name + ' ' + String(o.phone).replace(/^'/, '') +
    '\nລາຍການ: ' + o.item + ' x ' + o.qty + '\nຍອດໂອນ: ' + Number(o.total).toLocaleString('en-US') + ' ກີບ\nສະລິບ: ' + slipUrl +
    '\n\nກວດເງິນເຂົ້າໃນ BCEL One ໃຫ້ຕົງຍອດ ແລ້ວປ່ຽນສະຖານະໃນຊີດ "' + CFG.ORDER_SHEET + '" ເປັນ "' + STATUS.READY + '"';
  // 1) WhatsApp ແອັດມິນ
  whatsapp_(body);
  // 2) ອີເມວ
  const to = CFG.NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  if (to) { try { MailApp.sendEmail(to, 'ບິນໃໝ່ ' + o.bill + ' ລໍຖ້າກວດເງິນ', body); } catch (err) {} }
}

function whatsapp_(text) {
  const key = PropertiesService.getScriptProperties().getProperty('CALLMEBOT_APIKEY');
  if (!key || !CFG.ADMIN_WHATSAPP) return 'no key';
  const url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(CFG.ADMIN_WHATSAPP) +
    '&text=' + encodeURIComponent(text) + '&apikey=' + encodeURIComponent(key);
  try {
    const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    return r.getResponseCode() + ' ' + r.getContentText().slice(0, 200);
  } catch (err) { return String(err); }
}

// ທົດສອບ WhatsApp: ເລືອກຟັງຊັນ testWhatsApp ແລ້ວກົດ Run
function testWhatsApp() {
  const res = whatsapp_('ທົດສອບແຈ້ງເຕືອນ WhatsApp ຈາກລະບົບສັ່ງຊື້ ຮ້ານຄຳ ລິດປະສົງ ✅');
  Logger.log(res);
  return res;
}

function clean_(s, max) {
  return String(s || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
