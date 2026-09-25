const SHEET_NAME = 'Records';
const HEADERS = ['id', 'userNo', 'isChild', 'hasAssist', 'withChild', 'hasRoof', 'submittedAt'];

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function doGet() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return jsonResponse([]);
  return jsonResponse(values.slice(1).map(row => Object.fromEntries(HEADERS.map((key, index) => [key, row[index]]))));
}

function doPost(event) {
  const payload = JSON.parse(event.postData.contents || '{}');
  const sheet = getSheet();
  const records = sheet.getDataRange().getValues();

  if (payload.action === 'clear') {
    if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
    return jsonResponse([]);
  }

  if (payload.action === 'delete') {
    const rowNumber = records.findIndex(row => String(row[0]) === String(payload.id));
    if (rowNumber < 1) return jsonResponse({ error: '记录不存在' });
    sheet.deleteRow(rowNumber + 1);
    return jsonResponse({ id: payload.id, deleted: true });
  }

  if (payload.action === 'update') {
    const rowNumber = records.findIndex(row => String(row[0]) === String(payload.record.id));
    if (rowNumber < 1) return jsonResponse({ error: '记录不存在' });
    const updated = { ...payload.record, userNo: String(payload.record.userNo || '').trim() };
    sheet.getRange(rowNumber + 1, 1, 1, HEADERS.length).setValues([HEADERS.map(key => updated[key] || '')]);
    return jsonResponse(updated);
  }

  if (!payload.userNo) return jsonResponse({ error: '用户 No 不能为空' });
  const record = {
    id: Utilities.getUuid(),
    userNo: String(payload.userNo).trim(),
    isChild: payload.isChild || '否',
    hasAssist: payload.hasAssist || '否',
    withChild: payload.withChild || '否',
    hasRoof: payload.hasRoof || '否',
    submittedAt: payload.submittedAt || new Date().toLocaleString('zh-CN')
  };
  sheet.appendRow(HEADERS.map(key => record[key]));
  return jsonResponse(record);
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}