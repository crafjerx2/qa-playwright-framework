/**
 * @fileoverview Reusable table component for data table interactions.
 *
 * @description
 * Provides a typed API for interacting with HTML tables.
 * Handles common table operations — reading data, sorting, pagination.
 *
 * ## Why a Table Component?
 * Tables appear in many enterprise applications.
 * This component works for any <table> element — no duplication needed.
 *
 * @example
 * In a Page Object:
 * this.usersTable = new TableComponent(
 *   page.locator('table#users'),
 * );
 *
 * In a test:
 * const row = await usersTable.getRowByText('Carlos');
 * const email = await usersTable.getCellValue(row, 1);
 */
import { Locator } from '@playwright/test';
import { TestLogger } from '@utils/Logger';

export interface TableRow {
  /** 0-based row index */
  index: number;
  /** All cell values in this row */
  cells: string[];
  /** Raw Locator for the row element */
  locator: Locator;
}

export class TableComponent {
  private readonly name: string;

  // Child locators — relative to the table
  private readonly headers: Locator;
  private readonly rows: Locator;

  /**
   * @param tableLocator - The <table> element locator
   * @param name - Human-readable name for logging
   */
  constructor(tableLocator: Locator, name: string = 'Table') {
    this.name = name;

    // All locators relative to the table
    this.headers = tableLocator.locator('thead th');
    this.rows = tableLocator.locator('tbody tr');
  }

  // ─── Header methods ──────────────────────────────────────────
  /**
   * Returns all column header texts.
   */
  async getHeaders(): Promise<string[]> {
    return this.headers.allInnerTexts();
  }

  /**
   * Returns the index of a column by its header text.
   *
   * @param headerText - Column header to find
   * @returns 0-based column index, or -1 if not found
   */
  async getColumnIndex(headerText: string): Promise<number> {
    const headers = await this.getHeaders();
    return headers.indexOf(headerText);
  }

  // ─── Row methods ─────────────────────────────────────────────
  /**
   * Returns the total number of data rows.
   */
  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  /**
   * Returns all data from the table as a 2D array.
   *
   * @returns Array of rows, each row is an array of cell strings
   */
  async getAllData(): Promise<string[][]> {
    const rowCount = await this.getRowCount();
    const data: string[][] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = this.rows.nth(i);
      const cells = await row.locator('td').allInnerTexts();
      data.push(cells);
    }

    return data;
  }

  /**
   * Gets a typed TableRow by 0-based index.
   *
   * @param index - Row index (0-based)
   */
  async getRow(index: number): Promise<TableRow> {
    const rowLocator = this.rows.nth(index);
    const cells = await rowLocator.locator('td').allInnerTexts();
    return { index, cells, locator: rowLocator };
  }

  /**
   * Finds the first row containing specific text.
   *
   * @param text - Text to search for in any cell
   * @returns TableRow if found, undefined if not found
   */
  async getRowByText(text: string): Promise<TableRow | undefined> {
    const rowCount = await this.getRowCount();

    for (let i = 0; i < rowCount; i++) {
      const row = await this.getRow(i);
      if (row.cells.some((cell) => cell.includes(text))) {
        TestLogger.step(`${this.name}: found row ${i} with text "${text}"`);
        return row;
      }
    }
    TestLogger.step(`${this.name}: no row found with text "${text}"`);
    return undefined;
  }

  /**
   * Gets the value of a specific cell in a row.
   *
   * @param row - TableRow to read from
   * @param columnIndex - 0-based column index
   */
  getCellValue(row: TableRow, columnIndex: number): string {
    return row.cells[columnIndex] ?? '';
  }

  /**
   * Gets the value of a cell by row index and column header.
   *
   * @param rowIndex - 0-based row index
   * @param columnHeader - Header text of the column
   */
  async getCellByHeader(rowIndex: number, columnHeader: string): Promise<string> {
    const colIndex = await this.getColumnIndex(columnHeader);
    if (colIndex === -1) {
      throw new Error(`Column "${columnHeader}" not found in ${this.name}`);
    }
    const row = await this.getRow(rowIndex);
    return this.getCellValue(row, colIndex);
  }

  // ─── Action methods ──────────────────────────────────────────
  /**
   * Clicks a button/link in a specific table cell.
   *
   * @param row - The target row
   * @param columnIndex - Column containing the clickable element
   * @param buttonText - Optional text of the button to click
   */
  async clickCellAction(row: TableRow, columnIndex: number, buttonText?: string): Promise<void> {
    const cell = row.locator.locator('td').nth(columnIndex);

    if (buttonText) {
      await cell.getByText(buttonText).click();
    } else {
      await cell.click();
    }

    TestLogger.step(`${this.name}: clicked action in row ${row.index}, column ${columnIndex}`);
  }

  // ─── Verification helpers ────────────────────────────────────
  /**
   * Checks if the table contains any data rows.
   */
  async isEmpty(): Promise<boolean> {
    return (await this.getRowCount()) === 0;
  }

  /**
   * Checks if any row contains the specified text.
   */
  async containsText(text: string): Promise<boolean> {
    return (await this.getRowByText(text)) !== undefined;
  }

  /**
   * Verifies that a column's values are sorted in ascending order.
   *
   * @param columnIndex - 0-based column index to check
   */
  async isColumnSortedAscending(columnIndex: number): Promise<boolean> {
    const data = await this.getAllData();
    const columnValues = data.map((row) => row[columnIndex] ?? '');

    for (let i = 1; i < columnValues.length; i++) {
      if ((columnValues[i - 1] ?? '') > (columnValues[i] ?? '')) {
        return false;
      }
    }
    return true;
  }
}
