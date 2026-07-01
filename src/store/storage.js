import { STORAGE_KEY, SEED_PRODUCTS } from '../constants.js';
import { Product } from '../models/Product.js';

export const storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return SEED_PRODUCTS.map(p => new Product(p));
      return JSON.parse(raw).map(p => Product.fromJSON(p));
    } catch {
      return SEED_PRODUCTS.map(p => new Product(p));
    }
  },

  save(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products.map(p => p.toJSON())));
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
