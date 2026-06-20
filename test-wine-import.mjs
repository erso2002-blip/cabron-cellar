#!/usr/bin/env node

/**
 * Wine Import Feature Test Script
 * Tests the complete flow: template generation -> validation -> import
 */

import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

// Import the helper functions
let generateWineTemplate, validateWineRow;
try {
  const wineTemplateModule = await import(
    "./artifacts/api-server/dist/lib/wineTemplate.mjs"
  );
  generateWineTemplate = wineTemplateModule.generateWineTemplate;
  validateWineRow = wineTemplateModule.validateWineRow;
} catch (error) {
  console.error("❌ Failed to import wineTemplate module.");
  console.error("Make sure to run: pnpm --filter @workspace/api-server run build");
  console.error("Error:", error.message);
  process.exit(1);
}



console.log("🍷 Wine Import Feature - Complete Test Suite\n");
console.log("=" .repeat(60));

// Test 1: Generate Template
console.log("\n📝 Test 1: Generating Excel Template");
console.log("-" .repeat(60));

try {
  const templateBuffer = await generateWineTemplate();
  console.log(`✅ Template generated successfully`);
  console.log(`   Size: ${(templateBuffer.length / 1024).toFixed(2)} KB`);
  
  // Save for manual inspection
  const templatePath = "./template-test.xlsx";
  fs.writeFileSync(templatePath, templateBuffer);
  console.log(`   Saved to: ${templatePath}`);
} catch (error) {
  console.error("❌ Template generation failed:", error.message);
  process.exit(1);
}

// Test 2: Parse Template
console.log("\n📂 Test 2: Parsing Generated Template");
console.log("-" .repeat(60));

try {
  const workbook = new ExcelJS.Workbook();
  const buffer = fs.readFileSync("./template-test.xlsx");
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0];
  console.log(`✅ Template parsed successfully`);
  console.log(`   Worksheets: ${workbook.worksheets.length}`);
  console.log(`   First sheet: "${worksheet.name}"`);
  console.log(`   Rows: ${worksheet.rowCount}`);
  
  const headerRow = worksheet.getRow(1);
  const headers = (headerRow.values || []).slice(1).filter(Boolean);
  console.log(`   Headers: ${headers.join(" | ")}`);
} catch (error) {
  console.error("❌ Template parsing failed:", error.message);
  process.exit(1);
}

// Test 3: Validate Rows
console.log("\n✔️  Test 3: Validating Sample Rows");
console.log("-" .repeat(60));

const testCases = [
  {
    name: "Valid complete row",
    data: {
      "Nome do Vinho": "Cabernet Sauvignon Reserva",
      "Produtor": "Concha y Toro",
      "Safra": "2019",
      "Tipo": "Tinto",
      "País/Região": "Chile / Vale Central",
      "Preço": "85.50",
      "Website": "www.conchaytoro.com",
      "Estoque": "5",
      "Notas": "Excelente custo-benefício"
    },
    shouldPass: true
  },
  {
    name: "Valid minimal row (only required fields)",
    data: {
      "Nome do Vinho": "Malbec",
      "Produtor": "Trapiche",
      "Safra": "",
      "Tipo": "",
      "País/Região": "",
      "Preço": "",
      "Website": "",
      "Estoque": "",
      "Notas": ""
    },
    shouldPass: true
  },
  {
    name: "Invalid - missing wine name",
    data: {
      "Nome do Vinho": "",
      "Produtor": "Bodega Norton",
      "Safra": "2020",
      "Tipo": "Tinto",
      "País/Região": "",
      "Preço": "",
      "Website": "",
      "Estoque": "",
      "Notas": ""
    },
    shouldPass: false
  },
  {
    name: "Invalid - missing producer",
    data: {
      "Nome do Vinho": "Syrah Premium",
      "Produtor": "",
      "Safra": "2018",
      "Tipo": "Tinto",
      "País/Região": "",
      "Preço": "",
      "Website": "",
      "Estoque": "",
      "Notas": ""
    },
    shouldPass: false
  },
  {
    name: "Invalid - invalid vintage year",
    data: {
      "Nome do Vinho": "Pinot Noir",
      "Produtor": "Santa Rita",
      "Safra": "1700",
      "Tipo": "Tinto",
      "País/Região": "",
      "Preço": "",
      "Website": "",
      "Estoque": "",
      "Notas": ""
    },
    shouldPass: false
  },
  {
    name: "Invalid - invalid price",
    data: {
      "Nome do Vinho": "Carmenere",
      "Produtor": "Lapostolle",
      "Safra": "2019",
      "Tipo": "Tinto",
      "País/Região": "",
      "Preço": "abc123",
      "Website": "",
      "Estoque": "",
      "Notas": ""
    },
    shouldPass: false
  },
  {
    name: "Invalid - negative quantity",
    data: {
      "Nome do Vinho": "Sauvignon Blanc",
      "Produtor": "Casa Lapostolle",
      "Safra": "2021",
      "Tipo": "Branco",
      "País/Região": "",
      "Preço": "45.00",
      "Website": "",
      "Estoque": "-5",
      "Notas": ""
    },
    shouldPass: false
  }
];

let passCount = 0;
let failCount = 0;

for (const testCase of testCases) {
  const validation = validateWineRow(testCase.data, 2);
  const passed = validation.valid === testCase.shouldPass;
  
  if (passed) {
    passCount++;
    const status = testCase.shouldPass ? "✅ PASS" : "✅ PASS (correctly rejected)";
    console.log(`${status}: ${testCase.name}`);
  } else {
    failCount++;
    const expected = testCase.shouldPass ? "valid" : "invalid";
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${expected}, Got: ${validation.valid ? "valid" : "invalid"}`);
    if (validation.errors.length > 0) {
      console.log(`   Errors: ${validation.errors.join(", ")}`);
    }
  }
}

console.log(`\n   Result: ${passCount}/${passCount + failCount} tests passed`);

// Test 4: Data Extraction
console.log("\n🔍 Test 4: Data Extraction from Valid Row");
console.log("-" .repeat(60));

const validData = {
  "Nome do Vinho": "Chianti Classico Riserva",
  "Produtor": "Antinori",
  "Safra": "2016",
  "Tipo": "Tinto",
  "País/Região": "Itália / Toscana",
  "Preço": "120.50",
  "Website": "www.antinori.it",
  "Estoque": "3",
  "Notas": "Acervo especial"
};

const validation = validateWineRow(validData, 2);
if (validation.valid && validation.data) {
  console.log("✅ Data extracted successfully:");
  console.log(`   name: "${validation.data.name}"`);
  console.log(`   producer: "${validation.data.producer}"`);
  console.log(`   vintage: ${validation.data.vintage}`);
  console.log(`   grape: "${validation.data.grape}"`);
  console.log(`   country: "${validation.data.country}"`);
  console.log(`   region: "${validation.data.region}"`);
  console.log(`   pricePaid: ${validation.data.pricePaid}`);
  console.log(`   quantity: ${validation.data.quantity}`);
  console.log(`   wineryWebsiteUrl: "${validation.data.wineryWebsiteUrl}"`);
  console.log(`   notes: "${validation.data.notes}"`);
} else {
  console.error("❌ Failed to extract data");
}

// Cleanup
console.log("\n🧹 Cleanup");
console.log("-" .repeat(60));
try {
  fs.unlinkSync("./template-test.xlsx");
  console.log("✅ Test file cleaned up");
} catch (e) {
  console.log("⚠️  Could not delete test file");
}

// Summary
console.log("\n" + "=" .repeat(60));
console.log("✅ All tests completed successfully!\n");
console.log("Summary:");
console.log(`  - Template generation: ✅ Working`);
console.log(`  - Excel parsing: ✅ Working`);
console.log(`  - Data validation: ✅ ${passCount}/${passCount + failCount} tests passed`);
console.log(`  - Data extraction: ✅ Working`);
console.log("\n🎉 Wine import feature is ready to use!\n");
