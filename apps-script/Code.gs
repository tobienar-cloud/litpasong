/**
 * ລະບົບສັ່ງຊື້ຄຳອອນລາຍ ຮ້ານຄຳ ລິດປະສົງ (Litpasong Jewelry)
 * Google Apps Script — ວາງໃນ Google Sheet ລາຄາຄຳ (Extensions → Apps Script)
 *
 * ໜ້າເວັບ https://litpasong.com/order.html ສົ່ງຄຳສັ່ງຊື້ມາທີ່ນີ້.
 * ລາຄາຄິດໄລ່ຈາກຊີດ "ລາຄາຄຳ" (ຊື່ເກົ່າ "ชีต1") ສະເໝີ ລູກຄ້າແກ້ລາຄາເອງບໍ່ໄດ້.
 */

// ---------- ການຕັ້ງຄ່າ ----------
const CFG = {
  PRICE_SHEET: 'ລາຄາຄຳ',
  PRICE_SHEET_OLD: 'ชีต1',      // ຊື່ເກົ່າ ໃຊ້ໄດ້ທັງສອງຊື່
  PRICE_RANGE: 'A5:C20',
  BUY_RANGE: 'A5:E20',         // ຖັນ E = ລາຄາຊື້ເຂົ້າຂອງແຕ່ລະນ້ຳໜັກ       // ແຖວ 17–19 = ຄຳແທ່ງ 1 ສະຫຼຶງ, 2 ສະຫຼຶງ, 2 ບາດ (ຕັ້ງເປີເຊັນໃນຖັນ B ກ່ອນ ຈຶ່ງຂຶ້ນໃຫ້ລູກຄ້າເລືອກ)
  ORDER_SHEET: 'ຄຳສັ່ງຊື້',
  SLIP_FOLDER: 'ສະລິບໂອນເງິນ Litpasong',
  PHOTO_FOLDER: 'ຮູບລູກຄ້າ Litpasong',
  NOTIFY_EMAIL: '',            // ອີເມວແຈ້ງເຕືອນບິນໃໝ່ (ວ່າງ = ໃຊ້ອີເມວເຈົ້າຂອງຊີດ)
  ADMIN_WHATSAPP: '+8562097170747', // WhatsApp ແອັດມິນ ຮັບແຈ້ງເຕືອນບິນໃໝ່
  // ກະແຈ CallMeBot ເກັບໃນ Project Settings → Script properties ຊື່ CALLMEBOT_APIKEY (ບໍ່ໃສ່ໃນໂຄດ)
  PAY_MINUTES: 15,             // ລັອກລາຄາ 15 ນາທີ (ຈາກ 30 ນາທີ ຕັ້ງແຕ່ 15/11/2026)
  STATS_SHEET: 'ສະຖິຕິເຂົ້າເວັບ',
  LATE_SLIP_HOURS: 24,         // ໝົດເວລາແລ້ວ ຍັງແນບສະລິບໄດ້ພາຍໃນ 24 ຊົ່ວໂມງ (ແອັດມິນກວດເວລາໂອນ)
  PICKUP_MONTHS: 0,            // 0 = ຮັບຄຳໄດ້ບໍ່ຈຳກັດເວລາ (ຕັ້ງແຕ່ 31/10/2026)
  MAX_GRAMS: 75,               // ສູງສຸດ 5 ບາດ (75 ກຣາມ) ຕໍ່ບິນ
  TZ: 'Asia/Vientiane',
  SELL_FROM: '10:00',          // ເລີ່ມຊື້ຄຳ ແລະ ອອມຄຳອອນລາຍ (ເວລາລາວ)
  SELL_TO: '15:30',            // ປິດຊື້ຄຳ ແລະ ອອມຄຳອອນລາຍ ນອກເວລານີ້ເຮັດລາຍການໃໝ່ບໍ່ໄດ້
  // ---- ກັນການຍິງລະບົບ (rate limit) ----
  MAX_IMAGE_BYTES: 1500000,    // ຮູບລູກຄ້າ ແລະ ສະລິບ ບໍ່ເກີນ 1.5 MB (ແອັບ ແລະ ເວັບຫຍໍ້ຮູບໃຫ້ແລ້ວ)
  BILLS_PER_PHONE_HOUR: 5,     // ເບີດຽວສ້າງບິນໄດ້ບໍ່ເກີນ 5 ບິນ ຕໍ່ຊົ່ວໂມງ
  BILLS_PER_10MIN: 30,         // ທັງລະບົບສ້າງບິນໄດ້ບໍ່ເກີນ 30 ບິນ ຕໍ່ 10 ນາທີ
  SLIPS_PER_BILL: 3,           // ແນບສະລິບຊ້ຳໄດ້ບໍ່ເກີນ 3 ເທື່ອ ຕໍ່ບິນ
  UPLOADS_PER_HOUR: 60,        // ທັງລະບົບອັບໂຫຼດສະລິບໄດ້ບໍ່ເກີນ 60 ເທື່ອ ຕໍ່ຊົ່ວໂມງ
  LOGIN_FAILS_15MIN: 60,       // ທັງລະບົບໃສ່ PIN ຜິດໄດ້ບໍ່ເກີນ 60 ເທື່ອ ຕໍ່ 15 ນາທີ
  SAVINGS_OPEN: false,         // ອອມຄຳເປັນເງິນ ປິດແລ້ວ (15/11/2026)
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
  'ຄຳແທ່ງ 1 ສະຫຼຶງ':        { name: 'ຄຳແທ່ງ 1 ສະຫຼຶງ',     grams: 3.75,  kind: 'bar' },
  'ຄຳແທ່ງ 2 ສະຫຼຶງ':        { name: 'ຄຳແທ່ງ 2 ສະຫຼຶງ',     grams: 7.5,   kind: 'bar' },
  'ຄຳແທ່ງ 2 ບາດ':           { name: 'ຄຳແທ່ງ 2 ບາດ',        grams: 30,    kind: 'bar' },
};

const STATUS = {
  WAIT_PAY: 'ລໍຖ້າໂອນເງິນ',
  WAIT_CHECK: 'ລໍຖ້າກວດເງິນ',
  READY: 'ຈ່າຍແລ້ວ ພ້ອມຮັບ',
  DONE: 'ຮັບຄຳແລ້ວ',
  SOLD: 'ຂາຍຄືນໃຫ້ຮ້ານ',   // ລູກຄ້າຂາຍຄືນທາງ WhatsApp ບໍ່ໄດ້ມາຮັບຄຳ: ໃສ່ລາຄາຮັບຊື້ຄືນ ແລະ ສະລິບໂອນໃຫ້ລູກຄ້າ ໃນຖັນທ້າຍ
  CANCEL: 'ຍົກເລີກ',
  EXPIRED: 'ໝົດເວລາໂອນ',
};

const HEAD = ['ເລກບິນ', 'ເວລາສັ່ງ', 'ຊື່ລູກຄ້າ', 'ເບີໂທ', 'ລາຍການ', 'ຈຳນວນ', 'ນ້ຳໜັກ (g)',
  'ລາຄາຕໍ່ໜ່ວຍ (ກີບ)', 'ຍອດໂອນ (ກີບ)', 'ໂອນກ່ອນ', 'ສະລິບ', 'ເວລາແນບສະລິບ',
  'ສະຖານະ', 'ຮັບຄຳພາຍໃນ', 'ໝາຍເຫດແອັດມິນ', 'token', 'pin',
  'ລິ້ງໃບຈອງ', 'ເວລາຢືນຢັນເງິນ', 'ເວລາຮັບຄຳ', 'ນັດມາຮັບ',
  'ວັນເດືອນປີເກີດ', 'ບ້ານ', 'ເມືອງ', 'ແຂວງ', 'ຮູບລູກຄ້າ',
  'ເວລາຂາຍຄືນ', 'ລາຄາຮັບຊື້ຄືນ (ກີບ)', 'ສະລິບໂອນໃຫ້ລູກຄ້າ'];
const SITE = 'https://litpasong.com/';
const SAVINGS_CLOSED = 'ອອມຄຳເປັນເງິນ ປິດແລ້ວ · ອອມຄຳເປັນນ້ຳໜັກໄດ້ທີ່ https://litpasong.com/order.html ຫຼື ທັກແອັດມິນ WhatsApp 020 5895 4624';
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
  saveSheet_();
  return 'ok';
}

// ---------- ຈຸດຮັບຄຳຂໍຈາກໜ້າເວັບ ----------
function doGet(e) {
  const p = e.parameter || {};
  try {
    if (p.action !== 'items' && p.action !== 'hit') switchGate_();
    if (p.action === 'items') return json_({ ok: true, items: items_(), rules: rules_(), buy: buy_(), stamp: priceStamp_() });
    if (p.action === 'order') return json_({ ok: true, order: publicOrder_(find_(p.bill, p.t)) });
    if (/^save_/.test(String(p.action || '')) && !CFG.SAVINGS_OPEN) return json_({ ok: false, error: SAVINGS_CLOSED });
    if (p.action === 'save_info') { const r = saveRef_(); return json_(Object.assign({ ok: true, cap: r.cap, perGram: r.perGram, priceAt: r.at, fee: SAVE.FEE }, sellHours_())); }
    if (p.action === 'save_tx') return json_({ ok: true, tx: savePublic_(saveFind_(p.id, p.t)) });
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
    switchGate_();
    if (body.action === 'create') return json_({ ok: true, order: create_(body) });
    if (body.action === 'appt') return json_({ ok: true, order: setAppt_(body) });
    if (body.action === 'slip') return json_({ ok: true, order: slip_(body) });
    if (body.action === 'history') return json_({ ok: true, orders: history_(body) });
    if (body.action === 'profile') return json_(Object.assign({ ok: true }, profile_(body)));
    if (body.action === 'delete_request') return json_(Object.assign({ ok: true }, deleteRequest_(body)));
    if (/^save_/.test(String(body.action || '')) && !CFG.SAVINGS_OPEN) return json_({ ok: false, error: SAVINGS_CLOSED });
    if (body.action === 'save_deposit') return json_(Object.assign({ ok: true }, saveDeposit_(body)));
    if (body.action === 'save_slip') return json_({ ok: true, tx: saveSlip_(body) });
    if (body.action === 'save_account') return json_(Object.assign({ ok: true }, saveAccount_(body)));
    if (body.action === 'save_redeem') return json_(Object.assign({ ok: true }, saveRedeem_(body)));
    if (body.action === 'save_withdraw') return json_(Object.assign({ ok: true }, saveWithdraw_(body)));
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

// ---------- ລາຍການ ແລະ ລາຄາ ----------
function items_() {
  const rows = priceSheet_().getRange(CFG.PRICE_RANGE).getValues();
  const out = [];
  rows.forEach(r => {
    const label = String(r[0]).trim();
    const info = ITEMS[label];
    const price = Number(String(r[2]).replace(/[^0-9.]/g, ''));
    if (info && price > 0) out.push({ id: label, name: info.name, grams: info.grams, kind: info.kind, price: price });
  });
  // ຄຳຮູບປະພັນກ່ອນ ແລ້ວຄຳແທ່ງ ລຽງຈາກໃຫຍ່ຫາໜ້ອຍ ບໍ່ຂຶ້ນກັບລຳດັບແຖວໃນຊີດ
  return out.sort((a, b) => (a.kind === b.kind ? b.grams - a.grams : a.kind === 'jewelry' ? -1 : 1));
}

// ລາຄາຮັບຊື້ສຳລັບສະແດງໜ້າເວັບ ແລະ ທີວີໃນຮ້ານ (ບໍ່ສົ່ງແຖວ "ຊື້ເຂົ້າ ຮູບປະພັນດີ")
// buy_jewelry = C14, buy_bar_max = C16 ("ຊື້ເຂົ້າ ຄຳແທ່ງ" ຫຼື ຊື່ເກົ່າ "ຊື້ເຂົ້າ ຄຳແທ່ງສູງສຸດ")
// rows = ລາຄາຊື້ເຂົ້າໃນຖັນ E ຕາມຊື່ແຖວ ເຊັ່ນ { '1 ສະຫຼຶງ': 10410000, 'ຄຳແທ່ງ 1 ສະຫຼຶງ': 10650000 }
function buy_() {
  const BUY = { 'ຊື້ເຂົ້າຮູບປະພັນ': 'buy_jewelry', 'ຊື້ເຂົ້າຄຳແທ່ງ': 'buy_bar_max', 'ຊື້ເຂົ້າຄຳແທ່ງສູງສຸດ': 'buy_bar_max' };
  const rows = priceSheet_().getRange(CFG.BUY_RANGE).getValues();
  const out = { rows: {} };
  const num = v => Number(String(v).replace(/[^0-9.]/g, ''));
  rows.forEach(r => {
    const label = String(r[0]).trim();
    const key = BUY[label.replace(/\s+/g, '')];
    if (key && num(r[2]) > 0) out[key] = num(r[2]);
    if (ITEMS[label] && num(r[4]) > 0) out.rows[label] = num(r[4]);
  });
  return out;
}

// ເວລາອັບເດດລາຄາ ຈາກເຊວ D1 ຂອງຊີດລາຄາ ("ອັບເດດລາຄາ: 26-11-2026 10:05") ໃຫ້ແອັບສະແດງຕົງກັບຊີດທັນທີ
function priceStamp_() {
  try {
    const v = String(priceSheet_().getRange('D1').getDisplayValue());
    const m = /(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}:\d{2})/.exec(v);
    return m ? 'ອັບເດດ ວັນທີ ' + m[1].padStart(2, '0') + '/' + m[2].padStart(2, '0') + '/' + m[3] + ' ເວລາ ' + m[4] + ' ໂມງ' : '';
  } catch (e) {
    return '';
  }
}

function rules_() {
  return Object.assign({ payMinutes: CFG.PAY_MINUTES, pickupMonths: CFG.PICKUP_MONTHS, maxGrams: CFG.MAX_GRAMS }, sellHours_());
}

// ---------- ເວລາເປີດຊື້ຄຳ ແລະ ອອມຄຳອອນລາຍ ----------
function sellHours_() {
  return { sellFrom: CFG.SELL_FROM, sellTo: CFG.SELL_TO, nowMs: Date.now() };
}
function sellGate_() {
  const t = Utilities.formatDate(new Date(), CFG.TZ, 'HH:mm');
  if (t < CFG.SELL_FROM || t >= CFG.SELL_TO) {
    throw new Error('ຊື້ຄຳ ແລະ ອອມຄຳອອນລາຍໄດ້ທຸກມື້ ເວລາ ' + CFG.SELL_FROM + '–' + CFG.SELL_TO + ' ນ. ເທົ່ານັ້ນ ກະລຸນາກັບມາໃໝ່ໃນເວລາດັ່ງກ່າວ');
  }
}

// ---------- ສ້າງບິນ (ລັອກລາຄາ) ----------
function create_(b) {
  sellGate_();
  const first = text_(b.first, 40), last = text_(b.last, 40), phone = clean_(b.phone, 30);
  if (!first) throw new Error('ກະລຸນາໃສ່ຊື່');
  if (!last) throw new Error('ກະລຸນາໃສ່ນາມສະກຸນ');
  const name = first + ' ' + last;
  const dob = String(b.dob || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || dob < '1900-01-01' || dob > Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd')) throw new Error('ກະລຸນາໃສ່ວັນເດືອນປີເກີດໃຫ້ຖືກຕ້ອງ');
  const village = text_(b.village, 60), district = text_(b.district, 60), province = text_(b.province, 60);
  if (!village || !district || !province) throw new Error('ກະລຸນາໃສ່ທີ່ຢູ່ ບ້ານ ເມືອງ ແຂວງ ໃຫ້ຄົບ');
  const photo = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(String(b.photo || ''));
  if (!/^[0-9+ ()-]{8,20}$/.test(phone) || phone8_(phone).length < 8) throw new Error('ເບີໂທບໍ່ຖືກຕ້ອງ');
  const pin = String(b.pin || '');
  if (!/^[0-9]{6}$/.test(pin)) throw new Error('ລະຫັດ PIN ຕ້ອງເປັນຕົວເລກ 6 ໂຕ');
  if (weakPin_(pin, phone, dob)) throw new Error('PIN ນີ້ເດົາງ່າຍເກີນໄປ (ເລກຊ້ຳ ເລກລຽງ ເບີໂທ ຫຼື ວັນເກີດ) ກະລຸນາຕັ້ງ PIN ໃໝ່');
  const qty = Math.floor(Number(b.qty));
  if (!(qty >= 1 && qty <= 40)) throw new Error('ຈຳນວນບໍ່ຖືກຕ້ອງ');
  const item = items_().find(i => i.id === b.item);
  if (!item) throw new Error('ບໍ່ພົບລາຍການນີ້ ຫຼື ລາຄາຍັງບໍ່ພ້ອມ');
  const grams = Math.round(item.grams * qty * 1000) / 1000;
  limit_('bill10', CFG.BILLS_PER_10MIN, 600, 'ຕອນນີ້ມີຄົນສັ່ງຫຼາຍ ກະລຸນາລອງໃໝ່ໃນ 10 ນາທີ ຫຼື ທັກແອັດມິນ WhatsApp 020 5895 4624');
  limit_('billp_' + phone8_(phone), CFG.BILLS_PER_PHONE_HOUR, 3600, 'ເບີນີ້ສ້າງບິນຫຼາຍເກີນໄປ ກະລຸນາລໍຖ້າ 1 ຊົ່ວໂມງ ຫຼື ທັກແອັດມິນ WhatsApp 020 5895 4624');
  const appt = appt_(b.pickDate, b.pickTime);
  if (grams > CFG.MAX_GRAMS + 1e-9) throw new Error('ສັ່ງໄດ້ສູງສຸດ ' + (CFG.MAX_GRAMS / 15) + ' ບາດ (' + CFG.MAX_GRAMS + ' ກຣາມ) ຕໍ່ບິນ ຫຼາຍກວ່ານີ້ກະລຸນາທັກແອັດມິນ');

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
    let pickup = 'ບໍ່ຈຳກັດເວລາ';
    if (CFG.PICKUP_MONTHS > 0) { pickup = new Date(now); pickup.setMonth(pickup.getMonth() + CFG.PICKUP_MONTHS); }
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
    row[COL['ນັດມາຮັບ'] - 1] = appt;
    const dp = dob.split('-');
    row[COL['ວັນເດືອນປີເກີດ'] - 1] = "'" + dp[2] + '/' + dp[1] + '/' + dp[0];
    row[COL['ບ້ານ'] - 1] = village;
    row[COL['ເມືອງ'] - 1] = district;
    row[COL['ແຂວງ'] - 1] = province;
    if (photo) {
      const bytes = Utilities.base64Decode(photo[3]);
      if (bytes.length <= CFG.MAX_IMAGE_BYTES) {
        const it = DriveApp.getFoldersByName(CFG.PHOTO_FOLDER);
        const fd = it.hasNext() ? it.next() : DriveApp.createFolder(CFG.PHOTO_FOLDER);
        row[COL['ຮູບລູກຄ້າ'] - 1] = fd.createFile(Utilities.newBlob(bytes, photo[1], bill + '-' + phone8_(phone) + '.' + (photo[2] === 'jpeg' ? 'jpg' : photo[2]))).getUrl();
      }
    }
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
  if (bytes.length > CFG.MAX_IMAGE_BYTES) throw new Error('ຮູບໃຫຍ່ເກີນໄປ');
  limit_('slipb_' + o.bill, CFG.SLIPS_PER_BILL, 86400, 'ບິນນີ້ແນບສະລິບຫຼາຍເທື່ອແລ້ວ ກະລຸນາສົ່ງສະລິບທາງ WhatsApp 020 5895 4624');
  limit_('upl', CFG.UPLOADS_PER_HOUR, 3600, 'ລະບົບຮັບສະລິບຫຼາຍເກີນໄປ ກະລຸນາສົ່ງສະລິບທາງ WhatsApp 020 5895 4624');
  const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
  const file = folder_().createFile(Utilities.newBlob(bytes, m[1], o.bill + '.' + ext));
  sh.getRange(o.row, COL['ສະລິບ']).setValue(file.getUrl());
  stamp_(sh.getRange(o.row, COL['ເວລາແນບສະລິບ']));
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
  loginGate_();
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
    cache.put(key, String(fails + 1), 900); loginFail_();
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
    if (sh.getName() === SAVE.SHEET && e.range.getColumn() === SCOL['ສະຖານະ'] && e.range.getRow() >= 2) {
      const v = e.range.getValue();
      logStatus_(e);
      if (v === SSTATUS.DEP_OK || v === SSTATUS.RED_DONE || v === SSTATUS.WD_DONE) stamp_(sh.getRange(e.range.getRow(), SCOL['ເວລາຢືນຢັນ']));
      return;
    }
    if (sh.getName() !== CFG.ORDER_SHEET || e.range.getColumn() !== COL['ສະຖານະ'] || e.range.getRow() < 2) return;
    const v = e.range.getValue();
    logStatus_(e);
    const r = e.range.getRow();
    if (v === STATUS.READY) stamp_(sh.getRange(r, COL['ເວລາຢືນຢັນເງິນ']));
    if (v === STATUS.DONE) stamp_(sh.getRange(r, COL['ເວລາຮັບຄຳ']));
    if (v === STATUS.SOLD) stamp_(sh.getRange(r, COL['ເວລາຂາຍຄືນ']));
    // ຖ້າປ່ຽນສະຖານະກັບຄືນ (ເຊັ່ນ ກົດຜິດເປັນ ຮັບຄຳແລ້ວ ແລ້ວປ່ຽນກັບ) ລຶບເວລາທີ່ຄ້າງໄວ້ ບໍ່ໃຫ້ແອັບສັບສົນ (27/11/2026)
    if (v !== STATUS.DONE) sh.getRange(r, COL['ເວລາຮັບຄຳ']).clearContent();
    if (v !== STATUS.SOLD && COL['ເວລາຂາຍຄືນ']) sh.getRange(r, COL['ເວລາຂາຍຄືນ']).clearContent();
  } catch (err) {}
}

// ບັນທຶກເວລາ ວັນ/ເດືອນ/ປີ ຊົ່ວໂມງ:ນາທີ:ວິນາທີ
function stamp_(range) {
  range.setValue(new Date()).setNumberFormat('dd/mm/yyyy hh:mm:ss');
}

// ບັນທຶກທຸກຄັ້ງທີ່ປ່ຽນສະຖານະ ໄວ້ໃນ Note ຂອງຊ່ອງສະຖານະ (ເອົາເມົາໄປວາງເທິງຊ່ອງເພື່ອເບິ່ງ)
// ເວລາລະອຽດຮອດວິນາທີ ໃຊ້ທຽບກັບກ້ອງວົງຈອນປິດ. ອີເມວຜູ້ກົດ ສະແດງເມື່ອ Google ສົ່ງມາໃຫ້ເທົ່ານັ້ນ.
function logStatus_(e) {
  try {
    const when = Utilities.formatDate(new Date(), CFG.TZ, 'dd/MM/yyyy HH:mm:ss');
    let who = '';
    try { who = (e.user && e.user.getEmail && e.user.getEmail()) || Session.getActiveUser().getEmail() || ''; } catch (x) {}
    const from = (e.oldValue === undefined || e.oldValue === '') ? '—' : e.oldValue;
    const line = when + '  ' + from + ' → ' + e.range.getValue() + (who ? '  (' + who + ')' : '');
    const old = e.range.getNote();
    e.range.setNote(old ? old + '\n' + line : line);
  } catch (err) {}
}

// ---------- ຕົວຊ່ວຍ ----------
function orders_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CFG.ORDER_SHEET);
  if (!sh) throw new Error('ລະບົບຍັງບໍ່ໄດ້ຕັ້ງຄ່າ (ແລ່ນ setup ກ່ອນ)');
  // ເພີ່ມຖັນ ແລະ ຫົວຖັນໃໝ່ເອງ ເມື່ອ HEAD ຍາວຂຶ້ນ
  if (sh.getMaxColumns() < HEAD.length) sh.insertColumnsAfter(sh.getMaxColumns(), HEAD.length - sh.getMaxColumns());
  if (String(sh.getRange(1, HEAD.length).getValue()) !== HEAD[HEAD.length - 1]) {
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold').setBackground('#6e1423').setFontColor('#fbf1df');
    // ອັບເດດລາຍການສະຖານະໃນຊ່ອງເລືອກ (ເຊັ່ນ ເພີ່ມ "ຂາຍຄືນໃຫ້ຮ້ານ")
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(Object.values(STATUS), true).build();
    sh.getRange(2, COL['ສະຖານະ'], 2000, 1).setDataValidation(rule);
  }
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

// ມື້ ແລະ ເວລາປະມານທີ່ລູກຄ້າຈະມາຮັບຄຳ: ມື້ນີ້ ຫາ 31 ມື້ ຕາມເວລາລາວ, ຊ່ວງເວລາໃນເວລາເປີດຮ້ານ 8:00–15:30
const PICK_SLOTS = ['08:00–10:00', '10:00–12:00', '12:00–14:00', '14:00–15:30'];
function appt_(date, slot) {
  date = String(date || ''); slot = String(slot || '');
  if (!date && !slot) return ''; // ເລືອກພາຍຫຼັງໄດ້ໃນໃບຈອງ
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('ກະລຸນາເລືອກມື້ມາຮັບຄຳ');
  if (PICK_SLOTS.indexOf(slot) < 0) throw new Error('ກະລຸນາເລືອກເວລາປະມານທີ່ຈະມາຮັບຄຳ');
  const today = Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd');
  const max = Utilities.formatDate(new Date(Date.now() + 31 * 86400000), CFG.TZ, 'yyyy-MM-dd');
  if (date < today || date > max) throw new Error('ມື້ມາຮັບຄຳຕ້ອງເປັນມື້ນີ້ ຫາ 30 ມື້');
  const p = date.split('-');
  return p[2] + '/' + p[1] + '/' + p[0] + ' ເວລາ ' + slot;
}

// ລູກຄ້າເລືອກ ຫຼື ປ່ຽນມື້ມາຮັບຄຳພາຍຫຼັງ ຈາກໜ້າໃບຈອງ
function setAppt_(b) {
  const o = find_(b.bill, b.t);
  if ([STATUS.DONE, STATUS.SOLD, STATUS.CANCEL, STATUS.EXPIRED].indexOf(o.status) >= 0) throw new Error('ບິນນີ້ປ່ຽນມື້ມາຮັບບໍ່ໄດ້ແລ້ວ');
  const appt = appt_(b.pickDate, b.pickTime);
  if (!appt) throw new Error('ກະລຸນາເລືອກມື້ ແລະ ເວລາ');
  orders_().getRange(o.row, COL['ນັດມາຮັບ']).setValue(appt);
  SpreadsheetApp.flush();
  return publicOrder_(find_(b.bill, b.t));
}

function rowObj_(r, row) {
  const g = h => r[COL[h] - 1];
  return {
    row: row, bill: g('ເລກບິນ'), created: g('ເວລາສັ່ງ'), name: g('ຊື່ລູກຄ້າ'), phone: String(g('ເບີໂທ')),
    item: g('ລາຍການ'), qty: g('ຈຳນວນ'), grams: g('ນ້ຳໜັກ (g)'), price: g('ລາຄາຕໍ່ໜ່ວຍ (ກີບ)'),
    total: g('ຍອດໂອນ (ກີບ)'), due: g('ໂອນກ່ອນ'), slipAt: g('ເວລາແນບສະລິບ'), status: g('ສະຖານະ'),
    pickup: g('ຮັບຄຳພາຍໃນ'), appt: String(g('ນັດມາຮັບ') || ''), paidAt: g('ເວລາຢືນຢັນເງິນ'), doneAt: g('ເວລາຮັບຄຳ'),
    soldAt: g('ເວລາຂາຍຄືນ'), soldPrice: g('ລາຄາຮັບຊື້ຄືນ (ກີບ)'),
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
    status: o.status, appt: o.appt || '', pickup: CFG.PICKUP_MONTHS > 0 ? fd(o.pickup) : 'ບໍ່ຈຳກັດເວລາ', paidAt: f(o.paidAt), doneAt: o.status === STATUS.DONE ? f(o.doneAt) : '',
    soldAt: o.status === STATUS.SOLD ? f(o.soldAt) : '', soldPrice: Number(o.soldPrice) || 0,
    jewelry: String(o.item).indexOf('ຮູບປະພັນ') >= 0,
  };
}

function folder_() {
  const it = DriveApp.getFoldersByName(CFG.SLIP_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CFG.SLIP_FOLDER);
}

function notify_(o, slipUrl, late) {
  const body = (late ? '⚠️ ແນບສະລິບຫຼັງໝົດເວລາລັອກລາຄາ ກວດເວລາໂອນໃນສະລິບ\n' : '') + 'ບິນໃໝ່ລໍຖ້າກວດເງິນ\n\nເລກບິນ: ' + o.bill + '\nລູກຄ້າ: ' + o.name + ' ' + String(o.phone).replace(/^'/, '') +
    '\nລາຍການ: ' + o.item + ' x ' + o.qty + (o.appt ? '\nນັດມາຮັບ: ' + o.appt : '') + '\nຍອດໂອນ: ' + Number(o.total).toLocaleString('en-US') + ' ກີບ\nສະລິບ: ' + slipUrl +
    '\n\nກວດເງິນເຂົ້າໃນແອັບທະນາຄານ ໃຫ້ຕົງຍອດ ແລ້ວປ່ຽນສະຖານະໃນຊີດ "' + CFG.ORDER_SHEET + '" ເປັນ "' + STATUS.READY + '"';
  // 1) WhatsApp ແອັດມິນ: ສົ່ງຜ່ານບໍລິການພາຍນອກ (CallMeBot) ຈຶ່ງສົ່ງແຕ່ເລກບິນ ບໍ່ສົ່ງຊື່ ເບີ ຍອດເງິນ
  whatsapp_((late ? '⚠️ ແນບສະລິບຫຼັງໝົດເວລາ\n' : '') + 'ບິນໃໝ່ລໍຖ້າກວດເງິນ: ' + o.bill + '\nເບິ່ງລາຍລະອຽດໃນອີເມວ ຫຼື ຊີດ "' + CFG.ORDER_SHEET + '"');
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

// ຂໍ້ຄວາມທີ່ລູກຄ້າພິມ (ຊື່ ທີ່ຢູ່ ບັນຊີ): ຕັດ = + - @ ທາງໜ້າອອກ ເພື່ອບໍ່ໃຫ້ກາຍເປັນສູດໃນຊີດ
// (ສູດທີ່ແອບໃສ່ມາ ອາດດຶງຂໍ້ມູນລູກຄ້າຄົນອື່ນອອກໄປໄດ້)
function text_(s, max) {
  return clean_(s, max).replace(/^[=+\-@\s]+/, '').trim();
}

// ກັນການຍິງລະບົບ: ນັບຈຳນວນຄັ້ງໃນ CacheService ຖ້າເກີນ limit ພາຍໃນ sec ວິນາທີ ໃຫ້ປະຕິເສດ
function limit_(key, max, sec, msg) {
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get('rl_' + key) || 0);
  if (n >= max) throw new Error(msg || 'ມີການໃຊ້ງານຫຼາຍເກີນໄປ ກະລຸນາລໍຖ້າສັກຄູ່ ແລ້ວລອງໃໝ່');
  cache.put('rl_' + key, String(n + 1), sec);
}

// PIN ທີ່ເດົາງ່າຍ: ເລກຊ້ຳ (111111), ລຽງ (123456, 654321), 6 ໂຕທ້າຍຂອງເບີໂທ, ວັນເກີດ
function weakPin_(pin, phone, dob) {
  if (/^(\d)\1{5}$/.test(pin)) return true;
  if ('0123456789012345'.indexOf(pin) >= 0 || '9876543210987654'.indexOf(pin) >= 0) return true;
  if (/^(\d\d)\1\1$/.test(pin) || /^(\d{3})\1$/.test(pin)) return true; // 121212, 123123
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.length >= 6 && digits.slice(-6) === pin) return true;
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || ''));
  if (d) {
    const y2 = d[1].slice(2);
    if ([d[3] + d[2] + y2, y2 + d[2] + d[3], d[2] + d[3] + y2, d[3] + d[2] + d[1].slice(0, 2)].indexOf(pin) >= 0) return true;
  }
  return false;
}

// ນັບ PIN ຜິດລວມທັງລະບົບ ກັນການລອງ PIN ຍອດນິຍົມກັບຫຼາຍເບີ
function loginGate_() {
  const n = Number(CacheService.getScriptCache().get('gfail') || 0);
  if (n >= CFG.LOGIN_FAILS_15MIN) throw new Error('ລະບົບປິດການເຂົ້າສູ່ລະບົບຊົ່ວຄາວ ກະລຸນາລອງໃໝ່ໃນ 15 ນາທີ ຫຼື ທັກແອັດມິນ WhatsApp 020 5895 4624');
}
function loginFail_() {
  const cache = CacheService.getScriptCache();
  cache.put('gfail', String(Number(cache.get('gfail') || 0) + 1), 900);
}

function clean_(s, max) {
  return String(s || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// =====================================================================
// ---------- ອອມຄຳ (ອອມເງິນໄວ້ແລກເປັນຄຳ) ----------
// ລູກຄ້າໂອນເງິນເປັນຮອບ 100,000–1,000,000 ກີບ. ຍອດອອມນັບເປັນເງິນກີບ.
// ນ້ຳໜັກທີ່ສະແດງເປັນການທຽບໂດຍປະມານ ຕາມລາຄາຄຳ 1 ບາດ ປັດຈຸບັນ.
// ແລກເປັນຄຳ (≥ 1 ຫຸນ) ຕາມລາຄາ ณ ເວລາແລກ · ຖອນເງິນ ຫັກຄ່າທຳນຽມ 100,000 ກີບ.
// =====================================================================
const SAVE = {
  SHEET: 'ອອມຄຳ',
  STEP: 100000, MIN: 100000, MAX: 1000000,   // ຕົວເລືອກຍອດຕໍ່ຄັ້ງ
  FEE: 100000,                               // ຄ່າທຳນຽມຖອນເງິນ
  CAP_ITEM: '1 ບາດ',                          // ເພດານຍອດອອມ = ລາຄາຄຳຮູບປະພັນ 1 ບາດ ປັດຈຸບັນ
  SLIP_HOURS: 24,                            // ແນບສະລິບໄດ້ພາຍໃນ 24 ຊົ່ວໂມງ ຫຼັງສ້າງລາຍການ
};
const STYPE = { DEP: 'ຝາກ', RED: 'ແລກຄຳ', WD: 'ຖອນເງິນ' };
const SSTATUS = {
  DEP_WAIT: 'ລໍຖ້າໂອນເງິນ', DEP_CHECK: 'ລໍຖ້າກວດເງິນ', DEP_OK: 'ຢືນຢັນແລ້ວ',
  RED_WAIT: 'ລໍຖ້າຮັບຄຳ', RED_DONE: 'ຮັບຄຳແລ້ວ',
  WD_WAIT: 'ລໍຖ້າຖອນເງິນ', WD_DONE: 'ຖອນແລ້ວ',
  CANCEL: 'ຍົກເລີກ',
};
const SHEAD = ['ເລກລາຍການ', 'ເວລາ', 'ຊື່ລູກຄ້າ', 'ເບີໂທ', 'ປະເພດ', 'ຈຳນວນເງິນ (ກີບ)', 'ຄ່າທຳນຽມ (ກີບ)',
  'ລາຍການຄຳ', 'ນ້ຳໜັກ (g)', 'ສະລິບ', 'ເວລາແນບສະລິບ', 'ສະຖານະ', 'ຮັບເງິນຄືນທາງ', 'ໝາຍເຫດແອັດມິນ',
  'token', 'pin', 'ເວລາຢືນຢັນ'];
const SCOL = Object.fromEntries(SHEAD.map((h, i) => [h, i + 1]));

function priceSheet_() {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(CFG.PRICE_SHEET) || ss.getSheetByName(CFG.PRICE_SHEET_OLD);
}

function saveSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SAVE.SHEET);
  if (!sh) {
    sh = ss.insertSheet(SAVE.SHEET);
    sh.getRange(1, 1, 1, SHEAD.length).setValues([SHEAD]).setFontWeight('bold').setBackground('#6e1423').setFontColor('#fbf1df');
    sh.setFrozenRows(1);
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(Object.values(SSTATUS), true).build();
    sh.getRange(2, SCOL['ສະຖານະ'], 3000, 1).setDataValidation(rule);
    sh.hideColumns(SCOL['token']);
    sh.hideColumns(SCOL['pin']);
  }
  return sh;
}

function saveRows_() {
  const sh = saveSheet_(), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, SHEAD.length).getValues().map((r, i) => {
    const g = h => r[SCOL[h] - 1];
    return {
      row: i + 2, id: g('ເລກລາຍການ'), time: g('ເວລາ'), name: g('ຊື່ລູກຄ້າ'), phone: String(g('ເບີໂທ')).replace(/^'/, ''),
      type: g('ປະເພດ'), amount: Number(g('ຈຳນວນເງິນ (ກີບ)')) || 0, fee: Number(g('ຄ່າທຳນຽມ (ກີບ)')) || 0,
      item: g('ລາຍການຄຳ'), grams: g('ນ້ຳໜັກ (g)'), slipAt: g('ເວລາແນບສະລິບ'), status: g('ສະຖານະ'),
      payout: g('ຮັບເງິນຄືນທາງ'), token: g('token'), pin: g('pin'), okAt: g('ເວລາຢືນຢັນ'),
    };
  });
}

// ຍອດຄົງເຫຼືອ = ຝາກທີ່ຢືນຢັນແລ້ວ − ແລກຄຳ − ຖອນເງິນ (ທີ່ບໍ່ຍົກເລີກ)
function saveBalance_(rows) {
  const now = Date.now();
  let ok = 0, used = 0, pending = 0;
  rows.forEach(t => {
    if (t.type === STYPE.DEP) {
      if (t.status === SSTATUS.DEP_OK) ok += t.amount;
      else if (t.status === SSTATUS.DEP_CHECK) pending += t.amount;
      else if (t.status === SSTATUS.DEP_WAIT && t.time instanceof Date && now - t.time.getTime() < SAVE.SLIP_HOURS * 3600000) pending += t.amount;
    } else if (t.status !== SSTATUS.CANCEL) {
      used += t.amount;
    }
  });
  return { balance: ok - used, pending: pending, deposited: ok };
}

function saveRef_() {
  const items = items_();
  const ref = items.find(i => i.id === SAVE.CAP_ITEM);
  if (!ref) throw new Error('ລາຄາຄຳຍັງບໍ່ພ້ອມ ກະລຸນາລອງໃໝ່');
  return { items: items, cap: ref.price, perGram: ref.price / ref.grams,
           at: Utilities.formatDate(new Date(), CFG.TZ, 'dd/MM/yyyy HH:mm') };
}

function saveNewId_(rows) {
  const prefix = 'SAV-' + Utilities.formatDate(new Date(), CFG.TZ, 'yyyyMMdd') + '-';
  let n = 0;
  rows.forEach(t => { const s = String(t.id); if (s.indexOf(prefix) === 0) n = Math.max(n, Number(s.slice(prefix.length)) || 0); });
  return prefix + ('000' + (n + 1)).slice(-4);
}

// ກວດ PIN ຂອງບັນຊີ (ເບີໂທ). ຄືນລາຍການທັງໝົດຂອງເບີນີ້
function saveAuth_(phone, pin, allowNew) {
  const p8 = phone8_(phone);
  if (p8.length < 8) throw new Error('ເບີໂທບໍ່ຖືກຕ້ອງ');
  if (!/^[0-9]{6}$/.test(String(pin || ''))) throw new Error('ລະຫັດ PIN ຕ້ອງເປັນຕົວເລກ 6 ໂຕ');
  const cache = CacheService.getScriptCache(), key = 'sfail_' + p8;
  const fails = Number(cache.get(key) || 0);
  if (fails >= 5) throw new Error('ໃສ່ PIN ຜິດຫຼາຍເທື່ອ ກະລຸນາລໍຖ້າ 15 ນາທີ ຫຼື ທັກແອັດມິນ WhatsApp 020 5895 4624');
  loginGate_();
  const all = saveRows_();
  const mine = all.filter(t => phone8_(t.phone) === p8);
  const h = pinHash_(p8, pin);
  if (mine.length && mine[0].pin !== h) {
    cache.put(key, String(fails + 1), 900); loginFail_();
    throw new Error('PIN ບໍ່ຖືກຕ້ອງ (ເບີນີ້ມີບັນຊີອອມແລ້ວ ໃຊ້ PIN ທີ່ຕັ້ງຄັ້ງທຳອິດ)');
  }
  if (!mine.length && !allowNew) {
    cache.put(key, String(fails + 1), 900); loginFail_();
    throw new Error('ບໍ່ພົບບັນຊີອອມຂອງເບີນີ້');
  }
  cache.remove(key);
  return { all: all, mine: mine, hash: h };
}

function savePublic_(t) {
  const f = d => (d instanceof Date) ? Utilities.formatDate(d, CFG.TZ, 'dd/MM/yyyy HH:mm') : '';
  return { id: t.id, time: f(t.time), type: t.type, amount: t.amount, fee: t.fee, item: t.item || '',
           grams: t.grams || '', status: t.status, slipAt: f(t.slipAt), okAt: f(t.okAt), payout: t.payout || '',
           name: t.name, timeMs: (t.time instanceof Date) ? t.time.getTime() : 0,
           phone: t.phone.length > 4 ? t.phone.slice(0, -4).replace(/[0-9]/g, '•') + t.phone.slice(-4) : t.phone,
           jewelry: String(t.item || '').indexOf('ຮູບປະພັນ') >= 0, pickup: 'ບໍ່ຈຳກັດເວລາ' };
}

// ໜ້າບັນຊີ: ຍອດ + ທຽບນ້ຳໜັກປະມານ + ປະຫວັດ
function saveAccount_(b) {
  const a = saveAuth_(b.phone, b.pin, false);
  const ref = saveRef_(), bal = saveBalance_(a.mine);
  return {
    name: a.mine[a.mine.length - 1].name, balance: bal.balance, pending: bal.pending,
    cap: ref.cap, perGram: ref.perGram, priceAt: ref.at, fee: SAVE.FEE,
    items: ref.items.map(i => ({ id: i.id, name: i.name, grams: i.grams, kind: i.kind, price: i.price })),
    txs: a.mine.slice().reverse().map(t => Object.assign(savePublic_(t),
      ((t.type === STYPE.DEP && (t.status === SSTATUS.DEP_WAIT || t.status === SSTATUS.DEP_CHECK)) || t.type === STYPE.RED) ? { t: t.token } : {})),
  };
}

// ສ້າງລາຍການຝາກ
function saveDeposit_(b) {
  sellGate_();
  const name = text_(b.name, 80), phone = clean_(b.phone, 30);
  const amount = Math.round(Number(b.amount));
  if (!(amount >= SAVE.MIN && amount <= SAVE.MAX && amount % SAVE.STEP === 0)) throw new Error('ກະລຸນາເລືອກຍອດ 100,000 – 1,000,000 ກີບ');
  if (!/^[0-9+ ()-]{8,20}$/.test(phone)) throw new Error('ເບີໂທບໍ່ຖືກຕ້ອງ');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const a = saveAuth_(phone, b.pin, true);
    const nm = name || (a.mine.length ? a.mine[a.mine.length - 1].name : '');
    if (!nm) throw new Error('ກະລຸນາໃສ່ຊື່');
    const ref = saveRef_(), bal = saveBalance_(a.mine);
    if (bal.balance + bal.pending + amount > ref.cap) {
      const room = Math.max(0, Math.floor((ref.cap - bal.balance - bal.pending) / SAVE.STEP) * SAVE.STEP);
      throw new Error('ຍອດອອມສູງສຸດບໍ່ເກີນລາຄາຄຳ 1 ບາດ (' + ref.cap.toLocaleString('en-US') + ' ກີບ) · ຕອນນີ້ຝາກເພີ່ມໄດ້ອີກ ' +
        room.toLocaleString('en-US') + ' ກີບ' + (room < SAVE.MIN ? ' — ແລກເປັນຄຳກ່ອນ ແລ້ວຄ່ອຍອອມຕໍ່' : ''));
    }
    const id = saveNewId_(a.all), token = Utilities.getUuid().replace(/-/g, '');
    const row = new Array(SHEAD.length).fill('');
    row[SCOL['ເລກລາຍການ'] - 1] = id; row[SCOL['ເວລາ'] - 1] = new Date();
    row[SCOL['ຊື່ລູກຄ້າ'] - 1] = nm; row[SCOL['ເບີໂທ'] - 1] = "'" + phone;
    row[SCOL['ປະເພດ'] - 1] = STYPE.DEP; row[SCOL['ຈຳນວນເງິນ (ກີບ)'] - 1] = amount; row[SCOL['ຄ່າທຳນຽມ (ກີບ)'] - 1] = 0;
    row[SCOL['ສະຖານະ'] - 1] = SSTATUS.DEP_WAIT; row[SCOL['token'] - 1] = token; row[SCOL['pin'] - 1] = a.hash;
    saveSheet_().appendRow(row);
    return { id: id, t: token, amount: amount, name: nm, perGram: ref.perGram, priceAt: ref.at };
  } finally {
    lock.releaseLock();
  }
}

function saveFind_(id, token) {
  const t = saveRows_().find(x => x.id === String(id || '') && x.token === String(token || '') && token);
  if (!t) throw new Error('ບໍ່ພົບລາຍການ');
  return t;
}

// ແນບສະລິບການຝາກ
function saveSlip_(b) {
  const t = saveFind_(b.id, b.t);
  if (t.type !== STYPE.DEP || (t.status !== SSTATUS.DEP_WAIT && t.status !== SSTATUS.DEP_CHECK))
    throw new Error('ລາຍການນີ້ແນບສະລິບບໍ່ໄດ້ແລ້ວ (ສະຖານະ: ' + t.status + ') ຖ້າໂອນເງິນແລ້ວ ກະລຸນາສົ່ງສະລິບທາງ WhatsApp 020 5895 4624');
  if (t.time instanceof Date && Date.now() - t.time.getTime() > SAVE.SLIP_HOURS * 3600000)
    throw new Error('ລາຍການນີ້ເກີນ 24 ຊົ່ວໂມງແລ້ວ ຖ້າໂອນເງິນແລ້ວ ກະລຸນາສົ່ງສະລິບທາງ WhatsApp 020 5895 4624');
  const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(String(b.image || ''));
  if (!m) throw new Error('ກະລຸນາແນບຮູບສະລິບ');
  const bytes = Utilities.base64Decode(m[3]);
  if (bytes.length > CFG.MAX_IMAGE_BYTES) throw new Error('ຮູບໃຫຍ່ເກີນໄປ');
  const file = folder_().createFile(Utilities.newBlob(bytes, m[1], t.id + '.' + (m[2] === 'jpeg' ? 'jpg' : m[2])));
  const sh = saveSheet_();
  sh.getRange(t.row, SCOL['ສະລິບ']).setValue(file.getUrl());
  stamp_(sh.getRange(t.row, SCOL['ເວລາແນບສະລິບ']));
  sh.getRange(t.row, SCOL['ສະຖານະ']).setValue(SSTATUS.DEP_CHECK);
  saveNotify_('ອອມຄຳ: ລາຍການຝາກໃໝ່ ລໍຖ້າກວດເງິນ\n\nເລກລາຍການ: ' + t.id + '\nລູກຄ້າ: ' + t.name + ' ' + t.phone +
    '\nຍອດຝາກ: ' + t.amount.toLocaleString('en-US') + ' ກີບ\nສະລິບ: ' + file.getUrl() +
    '\n\nກວດເງິນເຂົ້າໃນແອັບທະນາຄານ ໃຫ້ຕົງຍອດ ແລ້ວປ່ຽນສະຖານະໃນຊີດ "' + SAVE.SHEET + '" ເປັນ "' + SSTATUS.DEP_OK + '"');
  return savePublic_(saveFind_(b.id, b.t));
}

// ແລກເປັນຄຳ (ລາຄາ ณ ເວລານີ້)
function saveRedeem_(b) {
  sellGate_();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const a = saveAuth_(b.phone, b.pin, false);
    const ref = saveRef_(), bal = saveBalance_(a.mine);
    const item = ref.items.find(i => i.id === b.item);
    if (!item) throw new Error('ບໍ່ພົບລາຍການຄຳນີ້');
    if (item.price > bal.balance) throw new Error('ຍອດອອມບໍ່ພໍ: ' + item.name + ' ລາຄາ ' + item.price.toLocaleString('en-US') +
      ' ກີບ · ຍອດທີ່ຢືນຢັນແລ້ວ ' + bal.balance.toLocaleString('en-US') + ' ກີບ');
    const id = saveNewId_(a.all), token = Utilities.getUuid().replace(/-/g, '');
    const last = a.mine[a.mine.length - 1];
    const row = new Array(SHEAD.length).fill('');
    row[SCOL['ເລກລາຍການ'] - 1] = id; row[SCOL['ເວລາ'] - 1] = new Date();
    row[SCOL['ຊື່ລູກຄ້າ'] - 1] = last.name; row[SCOL['ເບີໂທ'] - 1] = "'" + last.phone;
    row[SCOL['ປະເພດ'] - 1] = STYPE.RED; row[SCOL['ຈຳນວນເງິນ (ກີບ)'] - 1] = item.price; row[SCOL['ຄ່າທຳນຽມ (ກີບ)'] - 1] = 0;
    row[SCOL['ລາຍການຄຳ'] - 1] = item.name; row[SCOL['ນ້ຳໜັກ (g)'] - 1] = item.grams;
    row[SCOL['ສະຖານະ'] - 1] = SSTATUS.RED_WAIT; row[SCOL['token'] - 1] = token; row[SCOL['pin'] - 1] = a.hash;
    saveSheet_().appendRow(row);
    saveNotify_('ອອມຄຳ: ລູກຄ້າແລກເປັນຄຳ\n\nເລກລາຍການ: ' + id + '\nລູກຄ້າ: ' + last.name + ' ' + last.phone +
      '\nລາຍການ: ' + item.name + '\nລາຄາ ณ ເວລາແລກ: ' + item.price.toLocaleString('en-US') + ' ກີບ (ຫັກຈາກຍອດອອມແລ້ວ)' +
      '\n\nລູກຄ້າມາຮັບທີ່ຮ້ານ ແລ້ວປ່ຽນສະຖານະເປັນ "' + SSTATUS.RED_DONE + '"');
    return { tx: savePublic_(saveRows_().find(x => x.id === id)), t: token, balance: bal.balance - item.price };
  } finally {
    lock.releaseLock();
  }
}

// ຖອນເງິນ (ຫັກຄ່າທຳນຽມ)
function saveWithdraw_(b) {
  sellGate_();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const a = saveAuth_(b.phone, b.pin, false);
    const bal = saveBalance_(a.mine);
    const amount = Math.round(Number(b.amount));
    if (!(amount > SAVE.FEE)) throw new Error('ຍອດຖອນຕ້ອງຫຼາຍກວ່າຄ່າທຳນຽມ ' + SAVE.FEE.toLocaleString('en-US') + ' ກີບ');
    if (amount > bal.balance) throw new Error('ຍອດທີ່ຢືນຢັນແລ້ວມີ ' + bal.balance.toLocaleString('en-US') + ' ກີບ');
    const how = b.method === 'transfer' ? 'ໂອນເຂົ້າບັນຊີ: ' + text_(b.account, 120) : 'ຮັບເງິນສົດທີ່ຮ້ານ';
    if (b.method === 'transfer' && clean_(b.account, 120).length < 6) throw new Error('ກະລຸນາໃສ່ທະນາຄານ ເລກບັນຊີ ແລະ ຊື່ບັນຊີ');
    const id = saveNewId_(a.all), token = Utilities.getUuid().replace(/-/g, '');
    const last = a.mine[a.mine.length - 1];
    const row = new Array(SHEAD.length).fill('');
    row[SCOL['ເລກລາຍການ'] - 1] = id; row[SCOL['ເວລາ'] - 1] = new Date();
    row[SCOL['ຊື່ລູກຄ້າ'] - 1] = last.name; row[SCOL['ເບີໂທ'] - 1] = "'" + last.phone;
    row[SCOL['ປະເພດ'] - 1] = STYPE.WD; row[SCOL['ຈຳນວນເງິນ (ກີບ)'] - 1] = amount; row[SCOL['ຄ່າທຳນຽມ (ກີບ)'] - 1] = SAVE.FEE;
    row[SCOL['ສະຖານະ'] - 1] = SSTATUS.WD_WAIT; row[SCOL['ຮັບເງິນຄືນທາງ'] - 1] = how;
    row[SCOL['token'] - 1] = token; row[SCOL['pin'] - 1] = a.hash;
    saveSheet_().appendRow(row);
    saveNotify_('ອອມຄຳ: ລູກຄ້າຂໍຖອນເງິນ\n\nເລກລາຍການ: ' + id + '\nລູກຄ້າ: ' + last.name + ' ' + last.phone +
      '\nຫັກຈາກຍອດອອມ: ' + amount.toLocaleString('en-US') + ' ກີບ\nຄ່າທຳນຽມ: ' + SAVE.FEE.toLocaleString('en-US') +
      ' ກີບ\nຕ້ອງຈ່າຍໃຫ້ລູກຄ້າ: ' + (amount - SAVE.FEE).toLocaleString('en-US') + ' ກີບ\nທາງ: ' + how +
      '\n\nຈ່າຍແລ້ວ ປ່ຽນສະຖານະເປັນ "' + SSTATUS.WD_DONE + '"');
    return { tx: savePublic_(saveRows_().find(x => x.id === id)), balance: bal.balance - amount };
  } finally {
    lock.releaseLock();
  }
}

function saveNotify_(body) {
  whatsapp_(body.split('\n')[0] + '\nເບິ່ງລາຍລະອຽດໃນອີເມວ ຫຼື ຊີດ "' + SAVE.SHEET + '"');
  const to = CFG.NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  if (to) { try { MailApp.sendEmail(to, body.split('\n')[0], body); } catch (err) {} }
}


// ---------- ໂປຣໄຟລ໌ລູກຄ້າ (ເບີໂທ + PIN): ບິນສັ່ງຊື້ ແລະ ບັນຊີອອມ ໃນບ່ອນດຽວ ----------
// ຄຳຂໍລຶບບັນຊີ (ແອັບ ແລະ ໜ້າ delete-account.html): ກວດເບີໂທ + PIN ກ່ອນ ແລ້ວບັນທຶກໃນຊີດ ແລະ ແຈ້ງແອັດມິນ
// ແອັດມິນລຶບຂໍ້ມູນສ່ວນຕົວ (ບ້ານ ເມືອງ ແຂວງ ວັນເກີດ ຮູບ PIN) ພາຍໃນ 30 ມື້ ເກັບໄວ້ແຕ່ຂໍ້ມູນບິນທີ່ຕ້ອງເກັບຕາມກົດໝາຍ
function deleteRequest_(b) {
  const prof = profile_(b);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('ຄຳຂໍລຶບບັນຊີ');
  if (!sh) { sh = ss.insertSheet('ຄຳຂໍລຶບບັນຊີ'); sh.appendRow(['ເວລາຂໍ', 'ຊື່', 'ເບີໂທ', 'ຈຳນວນບິນ', 'ສະຖານະ']); sh.setFrozenRows(1); }
  const when = Utilities.formatDate(new Date(), CFG.TZ, 'dd/MM/yyyy HH:mm');
  sh.appendRow([when, prof.name || '', "'" + String(b.phone || ''), (prof.orders || []).length, 'ລໍຖ້າລຶບ']);
  const text = 'ຄຳຂໍລຶບບັນຊີ\nລູກຄ້າ: ' + (prof.name || '') + ' ' + b.phone + '\nເວລາ: ' + when +
    '\n\nລຶບຂໍ້ມູນສ່ວນຕົວໃນຊີດ "' + CFG.ORDER_SHEET + '" (ວັນເກີດ ບ້ານ ເມືອງ ແຂວງ ຮູບ pin) ພາຍໃນ 30 ມື້ ແລ້ວປ່ຽນສະຖານະໃນຊີດ "ຄຳຂໍລຶບບັນຊີ" ເປັນ "ລຶບແລ້ວ"';
  whatsapp_('ມີຄຳຂໍລຶບບັນຊີໃໝ່ ເບິ່ງລາຍລະອຽດໃນອີເມວ ຫຼື ຊີດ "ຄຳຂໍລຶບບັນຊີ"');
  const to = CFG.NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  if (to) { try { MailApp.sendEmail(to, 'ຄຳຂໍລຶບບັນຊີ ' + b.phone, text); } catch (err) {} }
  return {};
}

function profile_(b) {
  const p8 = phone8_(b.phone), pin = String(b.pin || '');
  if (p8.length < 8 || !/^[0-9]{4,6}$/.test(pin)) throw new Error('ກະລຸນາໃສ່ເບີໂທ ແລະ PIN 6 ຕົວເລກ');
  const cache = CacheService.getScriptCache(), key = 'fail_' + p8;
  const fails = Number(cache.get(key) || 0);
  if (fails >= 5) throw new Error('ໃສ່ PIN ຜິດຫຼາຍເທື່ອ ກະລຸນາລໍຖ້າ 15 ນາທີ ຫຼື ທັກແອັດມິນ WhatsApp 020 5895 4624');
  loginGate_();
  const h = pinHash_(p8, pin);
  // ບິນສັ່ງຊື້
  const orders = [];
  const sh = orders_(), last = sh.getLastRow();
  if (last > 1) {
    sh.getRange(2, 1, last - 1, HEAD.length).getValues().forEach((r, i) => {
      if (phone8_(r[COL['ເບີໂທ'] - 1]) === p8 && r[COL['pin'] - 1] === h) {
        orders.push(Object.assign(publicOrder_(rowObj_(r, i + 2)), { t: r[COL['token'] - 1] }));
      }
    });
  }
  orders.reverse();
  // ບັນຊີອອມ
  let savings = null, name = orders.length ? orders[0].name : '';
  const mine = saveRows_().filter(t => phone8_(t.phone) === p8 && t.pin === h);
  if (mine.length) {
    const bal = saveBalance_(mine), ref = saveRef_();
    savings = { balance: bal.balance, pending: bal.pending, perGram: ref.perGram, priceAt: ref.at, cap: ref.cap, count: mine.length };
    name = mine[mine.length - 1].name || name;
  }
  if (!orders.length && !savings) {
    cache.put(key, String(fails + 1), 900); loginFail_();
    throw new Error('ບໍ່ພົບຂໍ້ມູນ ກວດເບີໂທ ແລະ PIN ອີກຄັ້ງ (PIN ແມ່ນລະຫັດທີ່ຕັ້ງຕອນສັ່ງຊື້ ຫຼື ຕອນເລີ່ມອອມ)');
  }
  cache.remove(key);
  return { name: name, orders: orders, savings: savings };
}


// =====================================================================
// ---------- ສຳຮອງຂໍ້ມູນອັດຕະໂນມັດທຸກມື້ ----------
// ຕິດຕັ້ງຄັ້ງດຽວ: ເລືອກຟັງຊັນ installBackup ແລ້ວກົດ Run (ອະນຸຍາດສິດ Google Drive)
// ທຸກມື້ເວລາ 23:00 ຈະສຳເນົາໄຟລ໌ຊີດນີ້ທັງໄຟລ໌ໄວ້ໃນໂຟນເດີ "ສຳຮອງຂໍ້ມູນ Litpasong" ໃນ Drive
// ເກັບໄວ້ 30 ມື້ລ່າສຸດ ໄຟລ໌ເກົ່າກວ່ານັ້ນຍ້າຍໄປຖັງຂີ້ເຫຍື້ອ (ກູ້ຄືນໄດ້ອີກ 30 ມື້)
// ກູ້ຂໍ້ມູນ: ເປີດໄຟລ໌ສຳຮອງຂອງມື້ທີ່ຕ້ອງການ ແລ້ວກັອບປີ້ແຖວທີ່ຕ້ອງການກັບມາ
// =====================================================================
const BACKUP = { FOLDER: 'ສຳຮອງຂໍ້ມູນ Litpasong', KEEP_DAYS: 30, HOUR: 23 };

function installBackup() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'dailyBackup')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyBackup').timeBased().everyDays(1).atHour(BACKUP.HOUR).inTimezone(CFG.TZ).create();
  const name = dailyBackup();
  Logger.log('ຕິດຕັ້ງສຳຮອງທຸກມື້ເວລາ ' + BACKUP.HOUR + ':00 ແລ້ວ · ສຳຮອງທຳອິດ: ' + name);
  return name;
}

function dailyBackup() {
  const ss = SpreadsheetApp.getActive();
  const it = DriveApp.getFoldersByName(BACKUP.FOLDER);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(BACKUP.FOLDER);
  const name = 'ສຳຮອງ ' + ss.getName() + ' ' + Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd HHmm');
  DriveApp.getFileById(ss.getId()).makeCopy(name, folder);
  // ລຶບໄຟລ໌ສຳຮອງທີ່ເກົ່າກວ່າ KEEP_DAYS ມື້ (ຍ້າຍໄປຖັງຂີ້ເຫຍື້ອ ກູ້ຄືນໄດ້)
  const cutoff = Date.now() - BACKUP.KEEP_DAYS * 86400000;
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    if (f.getName().indexOf('ສຳຮອງ ') === 0 && f.getDateCreated().getTime() < cutoff) f.setTrashed(true);
  }
  return name;
}


// =====================================================================
// ---------- ປຸ່ມປິດລະບົບສຸກເສີນ (ແທັບ "ຕັ້ງຄ່າລະບົບ" ໃນຊີດ) ----------
// ເລືອກ "ປິດ" ໃນຊ່ອງ B2 → ລະບົບອອນລາຍ (ສັ່ງຊື້ ແນບສະລິບ ເບິ່ງບິນ ເຂົ້າສູ່ລະບົບ) ຢຸດທັນທີ
// ລາຄາຄຳຍັງສະແດງໃນເວັບ ແລະ ແອັບຕາມປົກກະຕິ · ເລືອກ "ເປີດ" ເພື່ອເປີດຄືນ
// ແທັບນີ້ສ້າງເອງອັດຕະໂນມັດ ເທື່ອທຳອິດທີ່ມີຄົນເປີດເວັບ ຫຼື ແອັບ
// =====================================================================
const SWITCH = { SHEET: 'ຕັ້ງຄ່າລະບົບ', OPEN: 'ເປີດ', CLOSED: 'ປິດ',
  MSG: 'ລະບົບອອນລາຍປິດຊົ່ວຄາວ ກະລຸນາມາທີ່ຮ້ານ ຫຼື ທັກ WhatsApp / ໂທ 020 9717 0747' };

function switchSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SWITCH.SHEET);
  if (sh) return sh;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return null;
  try {
    sh = ss.getSheetByName(SWITCH.SHEET);
    if (sh) return sh;
    sh = ss.insertSheet(SWITCH.SHEET);
    sh.getRange('A1:B1').setValues([['ຕັ້ງຄ່າ', 'ຄ່າ']]).setFontWeight('bold').setBackground('#6e1423').setFontColor('#fbf1df');
    sh.getRange('A2:B3').setValues([
      ['ລະບົບສັ່ງຊື້ອອນລາຍ (ເລືອກ ປິດ ເມື່ອມີບັນຫາ)', SWITCH.OPEN],
      ['ຂໍ້ຄວາມເຖິງລູກຄ້າ ຕອນປິດລະບົບ', SWITCH.MSG],
    ]);
    sh.getRange('B2').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList([SWITCH.OPEN, SWITCH.CLOSED], true).build())
      .setFontWeight('bold').setFontSize(14);
    sh.setColumnWidth(1, 320); sh.setColumnWidth(2, 520);
    sh.setFrozenRows(1);
    return sh;
  } finally {
    lock.releaseLock();
  }
}

function switchGate_() {
  const sh = switchSheet_();
  if (!sh) return;
  const v = sh.getRange('B2:B3').getDisplayValues();
  if (String(v[0][0]).trim() === SWITCH.CLOSED) throw new Error(String(v[1][0]).trim() || SWITCH.MSG);
}
