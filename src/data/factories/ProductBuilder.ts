import { faker } from '@faker-js/faker';

export interface TestProduct {
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly category: string;
  readonly isInStock: boolean;
}

export class ProductBuilder {
  private name: string = faker.commerce.productName();
  private description: string = faker.commerce.productDescription();
  private price: number = parseFloat(faker.commerce.price({ min: 1, max: 500 }));
  private category: string = faker.commerce.department();
  private isInStock: boolean = true;

  withName(name: string): ProductBuilder {
    this.name = name;
    return this;
  }

  withPrice(price: number): ProductBuilder {
    this.price = price;
    return this;
  }

  withCategory(category: string): ProductBuilder {
    this.category = category;
    return this;
  }

  outOfStock(): ProductBuilder {
    this.isInStock = false;
    return this;
  }

  inStock(): ProductBuilder {
    this.isInStock = true;
    return this;
  }

  // Static factory methods
  static cheap(): ProductBuilder {
    return new ProductBuilder().withPrice(parseFloat(faker.commerce.price({ min: 1, max: 20 })));
  }

  static expensive(): ProductBuilder {
    return new ProductBuilder().withPrice(
      parseFloat(faker.commerce.price({ min: 100, max: 1000 })),
    );
  }

  static random(): ProductBuilder {
    return new ProductBuilder();
  }

  build(): TestProduct {
    return Object.freeze({
      name: this.name,
      description: this.description,
      price: this.price,
      category: this.category,
      isInStock: this.isInStock,
    });
  }
}
