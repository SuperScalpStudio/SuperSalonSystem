
/**
 * 完全自動化進銷存後端程式 - 支援備註與負庫存
 */

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ensureSheetsSetup(ss);
  
  const products = getSheetData(sheets.productSheet);
  const transactions = getSheetData(sheets.transSheet);
  
  const productMap = {};
  products.forEach(p => {
    productMap[p.barcode] = {
      barcode: String(p.barcode),
      name: p.name,
      quantity: Number(p.quantity || 0),
      weightedAverageCost: Number(p.wac || 0),
      lastUpdated: p.lastupdated
    };
  });

  const transList = transactions.map(t => ({
    id: t.transactionid,
    date: t.date,
    type: t.type,
    items: JSON.parse(t.items || "[]"),
    totalAmount: Number(t.totalamount || 0),
    totalProfit: t.totalprofit ? Number(t.totalprofit) : undefined,
    remarks: t.remarks || ""
  }));

  return ContentService.createTextOutput(JSON.stringify({
    products: productMap,
    transactions: transList
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ensureSheetsSetup(ss);
  
  // 1. 記錄交易 (增加備註欄位)
  sheets.transSheet.appendRow([
    data.transaction.id,
    data.transaction.date,
    data.transaction.type,
    JSON.stringify(data.transaction.items),
    data.transaction.totalAmount,
    data.transaction.totalProfit || "",
    data.transaction.remarks || ""
  ]);
  
  // 2. 更新庫存狀態
  const productRows = sheets.productSheet.getDataRange().getValues();
  const headers = productRows[0].map(h => h.toString().toLowerCase());
  const barcodeIdx = headers.indexOf("barcode");
  
  Object.values(data.products).forEach(p => {
    let foundLine = -1;
    for(let i = 1; i < productRows.length; i++) {
      if(String(productRows[i][barcodeIdx]) === String(p.barcode)) {
        foundLine = i + 1;
        break;
      }
    }

    const rowData = [p.barcode, p.name, p.quantity, p.weightedAverageCost, p.lastUpdated];
    if(foundLine !== -1) {
      sheets.productSheet.getRange(foundLine, 1, 1, 5).setValues([rowData]);
    } else {
      sheets.productSheet.appendRow(rowData);
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureSheetsSetup(ss) {
  let productSheet = ss.getSheetByName("Products");
  let transSheet = ss.getSheetByName("Transactions");

  if (!productSheet) {
    const allSheets = ss.getSheets();
    const defaultSheet = ss.getSheetByName("工作表1") || ss.getSheetByName("Sheet1");
    if (allSheets.length === 1 && defaultSheet) {
      productSheet = defaultSheet;
      productSheet.setName("Products");
    } else {
      productSheet = ss.insertSheet("Products");
    }
  }

  if (!transSheet) {
    transSheet = ss.insertSheet("Transactions");
  }

  const pHeaders = ["barcode", "name", "quantity", "wac", "lastupdated"];
  const tHeaders = ["transactionid", "date", "type", "items", "totalamount", "totalprofit", "remarks"];

  if (productSheet.getLastRow() === 0) productSheet.appendRow(pHeaders);
  
  // 自動升級 Transactions 標題列若缺少 remarks
  const existingTHeaders = transSheet.getRange(1, 1, 1, transSheet.getLastColumn()).getValues()[0];
  if (!existingTHeaders.includes("remarks")) {
    transSheet.getRange(1, tHeaders.length).setValue("remarks");
  }

  return { productSheet, transSheet };
}

function getSheetData(sheet) {
  const range = sheet.getDataRange();
  const rows = range.getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0].map(h => h.toString().toLowerCase().trim());
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}
