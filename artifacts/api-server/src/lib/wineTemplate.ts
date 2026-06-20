import ExcelJS from "exceljs";
import { Readable } from "stream";

export interface WineTemplateRow {
  "Nome do Vinho": string;
  "Produtor": string;
  "Safra": number | string;
  "Tipo": string;
  "País/Região": string;
  "Preço": number | string;
  "Website": string;
  "Estoque": number;
  "Notas": string;
}

/**
 * Generate a wine import template in Excel format
 * Returns a Buffer containing the Excel file
 */
export async function generateWineTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Main data sheet
  const dataSheet = workbook.addWorksheet("Vinhos para Importar", {
    properties: { defaultColWidth: 20 }
  });

  // Instructions sheet
  const instructionsSheet = workbook.addWorksheet("Instruções", {
    properties: { defaultColWidth: 30 }
  });

  // ===== DATA SHEET =====
  // Headers
  const headers = [
    "Nome do Vinho",
    "Produtor",
    "Safra",
    "Tipo",
    "País/Região",
    "Preço",
    "Website",
    "Estoque",
    "Notas"
  ];

  const headerRow = dataSheet.addRow(headers);
  
  // Style header row
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F4E78" } // Dark blue
  };
  headerRow.alignment = { horizontal: "center" as any, vertical: "middle", wrapText: true };

  // Set column widths
  dataSheet.columns = [
    { width: 25 }, // Nome do Vinho
    { width: 20 }, // Produtor
    { width: 10 }, // Safra
    { width: 15 }, // Tipo
    { width: 25 }, // País/Região
    { width: 12 }, // Preço
    { width: 30 }, // Website
    { width: 10 }, // Estoque
    { width: 30 }  // Notas
  ];

  // Example data row
  const exampleRow = dataSheet.addRow([
    "Cabernet Sauvignon Reserva",
    "Concha y Toro",
    "2019",
    "Tinto",
    "Chile / Vale Central",
    "85.50",
    "www.conchaytoro.com",
    "5",
    "Exemplo de preenchimento. Remova esta linha antes de importar."
  ]);

  // Style example row
  exampleRow.font = { italic: true, color: { argb: "FF666666" } };
  exampleRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF0F0F0" } // Light gray
  };

  // Format columns
  // Safra - number
  dataSheet.getColumn(3).numFmt = "0";
  // Preço - currency
  dataSheet.getColumn(6).numFmt = "_-* #,##0.00_-;_-* (#,##0.00)_-;_-* \"-\"??_-;_-@_";
  // Estoque - number
  dataSheet.getColumn(8).numFmt = "0";

  // Freeze header row
  dataSheet.views = [{ state: "frozen", ySplit: 1 }];

  // ===== INSTRUCTIONS SHEET =====
  const instructionsTitle = instructionsSheet.addRow(["INSTRUÇÕES DE IMPORTAÇÃO"]);
  instructionsTitle.font = { bold: true, size: 14 };
  instructionsSheet.addRow([]);

  // Instructions content
  const instructions = [
    ["Campo", "Descrição", "Obrigatório?", "Exemplo"],
    ["Nome do Vinho", "Nome completo do vinho", "SIM", "Cabernet Sauvignon Reserva"],
    ["Produtor", "Nome da produtora/vinícola", "SIM", "Concha y Toro"],
    ["Safra", "Ano de colheita (4 dígitos)", "NÃO", "2019"],
    ["Tipo", "Tinto, Branco, Rosé, Espumante, Doce", "NÃO", "Tinto"],
    ["País/Região", "País e/ou região de origem", "NÃO", "Chile / Vale Central"],
    ["Preço", "Preço pago (separe decimais com ponto)", "NÃO", "85.50"],
    ["Website", "Site da vinícola (URL completa)", "NÃO", "www.conchaytoro.com"],
    ["Estoque", "Quantidade de garrafas em estoque", "NÃO", "5"],
    ["Notas", "Observações adicionais sobre o vinho", "NÃO", "Adquirido em 2021"]
  ];

  const instructionsStartRow = 4;
  instructions.forEach((instruction, index) => {
    const row = instructionsSheet.addRow(instruction);
    if (index === 0) {
      row.font = { bold: true, color: { argb: "FFFFFFFF" } };
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F4E78" }
      };
    }
  });

  instructionsSheet.columns = [
    { width: 15 },
    { width: 40 },
    { width: 15 },
    { width: 30 }
  ];

  // Add validation rules section
  instructionsSheet.addRow([]);
  const validationTitle = instructionsSheet.addRow(["REGRAS DE VALIDAÇÃO"]);
  validationTitle.font = { bold: true, size: 12 };

  const validationRules = [
    ["Comprimento máximo de Nome do Vinho", "160 caracteres"],
    ["Comprimento máximo de Produtor", "160 caracteres"],
    ["Comprimento máximo de País/Região", "80 caracteres"],
    ["Comprimento máximo de Website", "300 caracteres"],
    ["Safra válida", "Entre 1800 e " + (new Date().getFullYear() + 1)],
    ["Estoque mínimo", "0 (zero ou maior)"],
    ["Preço mínimo", "0 (zero ou maior)"],
    ["Quantidade máxima de itens por importação", "1000 linhas"]
  ];

  validationRules.forEach((rule) => {
    instructionsSheet.addRow(rule);
  });

  // Add tips section
  instructionsSheet.addRow([]);
  const tipsTitle = instructionsSheet.addRow(["DICAS"]);
  tipsTitle.font = { bold: true, size: 12 };

  const tips = [
    ["✓ Preencha apenas os campos com dados disponíveis"],
    ["✓ Deixe campos vazios se não tiver informação"],
    ["✓ Remova a linha de exemplo antes de importar"],
    ["✓ Use URLs completas para o Website (incluir http:// ou https://)"],
    ["✓ Para países com múltiplas regiões, separe com /"]
  ];

  tips.forEach((tip) => {
    instructionsSheet.addRow(tip);
  });

  // Convert workbook to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as any as Buffer;
}

/**
 * Validate a row from the imported Excel file
 */
export function validateWineRow(row: Record<string, any>, rowNumber: number): {
  valid: boolean;
  errors: string[];
  data?: Partial<Record<string, any>>;
} {
  const errors: string[] = [];
  const data: Record<string, any> = {};

  // Name (required)
  if (!row["Nome do Vinho"] || typeof row["Nome do Vinho"] !== "string" || row["Nome do Vinho"].trim().length === 0) {
    errors.push("Linha " + rowNumber + ": Nome do Vinho é obrigatório");
  } else if (row["Nome do Vinho"].length > 160) {
    errors.push("Linha " + rowNumber + ": Nome do Vinho excede 160 caracteres");
  } else {
    data.name = row["Nome do Vinho"].trim();
  }

  // Producer (required)
  if (!row["Produtor"] || typeof row["Produtor"] !== "string" || row["Produtor"].trim().length === 0) {
    errors.push("Linha " + rowNumber + ": Produtor é obrigatório");
  } else if (row["Produtor"].length > 160) {
    errors.push("Linha " + rowNumber + ": Produtor excede 160 caracteres");
  } else {
    data.producer = row["Produtor"].trim();
  }

  // Vintage (optional, but validate if present)
  if (row["Safra"] && row["Safra"] !== "") {
    const vintage = Number(row["Safra"]);
    if (isNaN(vintage) || !Number.isInteger(vintage)) {
      errors.push("Linha " + rowNumber + ": Safra deve ser um número inteiro");
    } else if (vintage < 1800 || vintage > new Date().getFullYear() + 1) {
      errors.push("Linha " + rowNumber + ": Safra deve estar entre 1800 e " + (new Date().getFullYear() + 1));
    } else {
      data.vintage = vintage;
    }
  }

  // Type (optional)
  if (row["Tipo"] && typeof row["Tipo"] === "string" && row["Tipo"].trim().length > 0) {
    if (row["Tipo"].length > 80) {
      errors.push("Linha " + rowNumber + ": Tipo excede 80 caracteres");
    } else {
      data.grape = row["Tipo"].trim(); // Using grape field for type
    }
  }

  // Country/Region (optional)
  if (row["País/Região"] && typeof row["País/Região"] === "string" && row["País/Região"].trim().length > 0) {
    const countryRegion = row["País/Região"].trim();
    // Split by / to validate parts
    const parts = countryRegion.split("/").map(p => p.trim());
    if (parts[0] && parts[0].length > 80) {
      errors.push("Linha " + rowNumber + ": País excede 80 caracteres");
    } else if (parts[1] && parts[1].length > 120) {
      errors.push("Linha " + rowNumber + ": Região excede 120 caracteres");
    } else {
      data.country = parts[0] || undefined;
      data.region = parts[1] || undefined;
    }
  }

  // Price (optional)
  if (row["Preço"] && row["Preço"] !== "") {
    const price = Number(row["Preço"]);
    if (isNaN(price)) {
      errors.push("Linha " + rowNumber + ": Preço deve ser um número válido");
    } else if (price < 0) {
      errors.push("Linha " + rowNumber + ": Preço não pode ser negativo");
    } else {
      data.pricePaid = price.toFixed(2);
    }
  }

  // Website (optional)
  if (row["Website"] && typeof row["Website"] === "string" && row["Website"].trim().length > 0) {
    const url = row["Website"].trim();
    if (url.length > 300) {
      errors.push("Linha " + rowNumber + ": Website excede 300 caracteres");
    } else {
      data.wineryWebsiteUrl = url;
    }
  }

  // Quantity/Stock (optional)
  if (row["Estoque"] && row["Estoque"] !== "") {
    const quantity = Number(row["Estoque"]);
    if (isNaN(quantity) || !Number.isInteger(quantity)) {
      errors.push("Linha " + rowNumber + ": Estoque deve ser um número inteiro");
    } else if (quantity < 0) {
      errors.push("Linha " + rowNumber + ": Estoque não pode ser negativo");
    } else {
      data.quantity = quantity;
    }
  } else {
    data.quantity = 1; // Default quantity
  }

  // Notes (optional)
  if (row["Notas"] && typeof row["Notas"] === "string" && row["Notas"].trim().length > 0) {
    if (row["Notas"].length > 2000) {
      errors.push("Linha " + rowNumber + ": Notas excedem 2000 caracteres");
    } else {
      data.notes = row["Notas"].trim();
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : undefined
  };
}
