/**
 * @fileoverview CSV data provider for test data management.
 *
 * @description
 * Loads and parses CSV test data files.
 * Converts CSV rows into typed TypeScript objects.
 *
 * ## CSV Format:
 * - First row must be headers
 * - Headers become object property names
 * - Empty values become empty strings
 *
 * @example
 * const provider = new CsvDataProvider('login-scenarios.csv');
 * const scenarios = await provider.getAll();
 * // Returns: [{ id: 'TC001', username: 'standard_user', ... }]
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CsvRow {
  [key: string]: string;
}

export class CsvDataProvider<T extends CsvRow> {
  private readonly filePath: string;
  private cache: T[] | null = null;

  /**
   * @param fileName - CSV filename (e.g., 'login-scenarios.csv')
   */
  constructor(private readonly fileName: string) {
    this.filePath = path.join(process.cwd(), 'src', 'data', 'csv', fileName);
  }

  /**
   * Loads all rows from the CSV file as typed objects.
   * Results are cached after first load.
   *
   * @returns Array of typed row objects
   */
  async getAll(): Promise<T[]> {
    if (this.cache) return this.cache;

    if (!fs.existsSync(this.filePath)) {
      throw new Error(`CSV file not found: ${this.filePath}`);
    }

    const raw = fs.readFileSync(this.filePath, 'utf-8');
    const lines = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      throw new Error(`CSV file "${this.fileName}" has no data rows`);
    }

    const headers = this.parseLine(lines[0]!);
    const rows = lines.slice(1);

    this.cache = rows.map((row) => {
      const values = this.parseLine(row);
      const obj: Record<string, string> = {};

      headers.forEach((header, index) => {
        obj[header] = values[index] ?? '';
      });

      return obj as T;
    });

    return this.cache;
  }

  /**
   * Gets a row by the value of a specific column.
   *
   * @param column - Column name to search in
   * @param value - Value to match
   */
  async getByColumn(column: keyof T, value: string): Promise<T | undefined> {
    const all = await this.getAll();
    return all.find((row) => row[column] === value);
  }

  /**
   * Gets a row by its 'id' column.
   *
   * @param id - ID value to find
   */
  async getById(id: string): Promise<T | undefined> {
    return this.getByColumn('id' as keyof T, id);
  }

  /**
   * Filters rows by a predicate function.
   */
  async filter(predicate: (row: T) => boolean): Promise<T[]> {
    const all = await this.getAll();
    return all.filter(predicate);
  }

  /**
   * Converts loaded data to test.each format.
   * Each row becomes [description, ...values].
   *
   * @param descriptionKey - Column to use as test description
   */
  async toTestEach(): Promise<T[]> {
    return this.getAll();
  }

  /**
   * Clears the cache to force reload from disk.
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Parses a single CSV line handling quoted values.
   */
  private parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}
