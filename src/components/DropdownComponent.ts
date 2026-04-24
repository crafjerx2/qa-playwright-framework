/**
 * @fileoverview Reusable dropdown component for select elements.
 *
 * @description
 * Wraps Playwright's select interaction with a typed, semantic API.
 * Works for both native <select> elements and custom dropdown menus.
 *
 * ## POM Component Pattern:
 * Dropdown behavior is the same across all pages that have it.
 * Instead of duplicating select logic, one component handles all.
 *
 * @example
 * // In InventoryPage:
 * this.sortDropdown = new DropdownComponent(
 *   page.locator('[data-test="product-sort-container"]')
 * );
 *
 * // In test:
 * await inventoryPage.sortDropdown.selectByLabel('Price (low to high)');
 * const selected = await inventoryPage.sortDropdown.getSelectedLabel();
 */
import { Locator } from '@playwright/test';
import { TestLogger } from '@utils/Logger';

/**
 * Option descriptor for typed dropdown selections.
 */
export interface DropdownOption {
  value?: string;
  label?: string;
  index?: number;
}

export class DropdownComponent {
  private readonly locator: Locator;
  private readonly componentName: string;

  /**
   * @param locator - The <select> or dropdown container element
   * @param name - Human-readable name for logging
   */
  constructor(locator: Locator, name: string = 'Dropdown') {
    this.locator = locator;
    this.componentName = name;
  }

  // ─── Selection methods ───────────────────────────────────────
  /**
   * Selects an option by its value attribute.
   *
   * @param value - The option's value attribute
   *
   * @example
   * await dropdown.selectByValue('az');
   */
  async selectByValue(value: string): Promise<void> {
    TestLogger.step(`${this.componentName}: selecting value "${value}"`);
    await this.locator.selectOption({ value });
  }

  /**
   * Selects an option by its visible label text.
   *
   * @param label - The option's visible text
   *
   * @example
   * await dropdown.selectByLabel('Price (low to high)');
   */
  async selectByLabel(label: string): Promise<void> {
    TestLogger.step(`${this.componentName}: selecting label "${label}"`);
    await this.locator.selectOption({ label });
  }

  /**
   * Selects an option by its position (0-based index).
   *
   * @param index - Zero-based position in the dropdown
   */
  async selectByIndex(index: number): Promise<void> {
    TestLogger.step(`${this.componentName}: selecting index ${index}`);
    await this.locator.selectOption({ index });
  }

  /**
   * Selects using a flexible DropdownOption descriptor.
   *
   * @param option - Option with value, label, or index
   */
  async select(option: DropdownOption): Promise<void> {
    if (option.value !== undefined) {
      await this.selectByValue(option.value);
    } else if (option.label !== undefined) {
      await this.selectByLabel(option.label);
    } else if (option.index !== undefined) {
      await this.selectByIndex(option.index);
    } else {
      throw new Error('DropdownOption must have value, label, or index');
    }
  }

  // ─── State methods ───────────────────────────────────────────
  /**
   * Returns the currently selected option's value.
   */
  async getSelectedValue(): Promise<string> {
    return this.locator.inputValue();
  }
  /**
   * Returns all available option labels.
   *
   * @returns Array of option text values
   */
  async getAllOptions(): Promise<string[]> {
    return this.locator.evaluate((select: HTMLSelectElement) =>
      Array.from(select.options).map((opt) => opt.text),
    );
  }

  /**
   * Returns the count of available options.
   */
  async getOptionCount(): Promise<number> {
    return this.locator.evaluate((select: HTMLSelectElement) => select.options.length);
  }

  /**
   * Checks if a specific option exists in the dropdown.
   *
   * @param label - Option label to search for
   */
  async hasOption(label: string): Promise<boolean> {
    const options = await this.getAllOptions();
    return options.includes(label);
  }

  /**
   * Checks if the dropdown is currently enabled.
   */
  async isEnabled(): Promise<boolean> {
    return this.locator.isEnabled();
  }
}
