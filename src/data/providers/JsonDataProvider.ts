/**
 * @fileoverview JSON data provider for test data management.
 *
 * @description
 * Loads and parses JSON test data files.
 * Provides typed access to test data from JSON files.
 *
 * SINGLE RESPONSIBILITY: Only loads and parses JSON data.
 * DEPENDENCY INVERSION: Implements IDataProvider interface.
 *
 * @example
 * const provider = new JsonDataProvider<UserData>('users.json');
 * const users = await provider.getAll();
 * const user = await provider.getById('user-001');
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Types ───────────────────────────────────────────────────

export interface HasId {
  id: string;
}

// ─── JsonDataProvider ─────────────────────────────────────────

export class JsonDataProvider<T extends HasId> {
  private readonly filePath: string;
  private cache: T[] | null = null;

  /**
   * @param fileName - JSON filename (e.g., 'users.json')
   * @param arrayKey - Key of the array in the JSON (optional)
   */
  constructor(
    private readonly fileName: string,
    private readonly arrayKey?: string,
  ) {
    this.filePath = path.join(process.cwd(), 'src', 'data', 'json', fileName);
  }

  /**
   * Loads all records from the JSON file.
   * Results are cached after first load.
   *
   * @returns Array of typed records
   */
  async getAll(): Promise<T[]> {
    if (this.cache) return this.cache;

    if (!fs.existsSync(this.filePath)) {
      throw new Error(`Data file not found: ${this.filePath}`);
    }

    const raw = fs.readFileSync(this.filePath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;

    if (this.arrayKey) {
      const obj = parsed as Record<string, unknown>;
      this.cache = (obj[this.arrayKey] as T[]) ?? [];
    } else if (Array.isArray(parsed)) {
      this.cache = parsed as T[];
    } else {
      throw new Error(
        `JSON file "${this.fileName}" does not contain an array. ` +
          `Provide an arrayKey to specify which property to use.`,
      );
    }

    return this.cache;
  }

  /**
   * Gets a single record by its ID.
   *
   * @param id - Record ID to find
   * @returns Record or undefined if not found
   */
  async getById(id: string): Promise<T | undefined> {
    const all = await this.getAll();
    return all.find((item) => item.id === id);
  }

  /**
   * Gets a random record from the dataset.
   *
   * @returns Random record
   */
  async getRandom(): Promise<T> {
    const all = await this.getAll();
    if (all.length === 0) {
      throw new Error(`No data available in ${this.fileName}`);
    }
    const index = Math.floor(Math.random() * all.length);
    return all[index]!;
  }

  /**
   * Filters records by a predicate function.
   *
   * @param predicate - Filter function
   * @returns Filtered array
   */
  async filter(predicate: (item: T) => boolean): Promise<T[]> {
    const all = await this.getAll();
    return all.filter(predicate);
  }

  /**
   * Clears the in-memory cache.
   * Use when you need to reload data from disk.
   */
  clearCache(): void {
    this.cache = null;
  }
}
