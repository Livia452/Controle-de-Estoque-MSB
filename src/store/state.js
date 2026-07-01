import { storage } from './storage.js';
import { Product } from '../models/Product.js';

const subscribers = new Set();

function notify(eventType, payload) {
  subscribers.forEach(fn => fn(eventType, payload));
}

let products = storage.load();

export const state = {
  getAll() {
    return [...products];
  },

  getByCode(code) {
    return products.find(p => p.code === code.toUpperCase()) ?? null;
  },

  addOrUpdate(productData) {
    const incoming = new Product(productData);
    const idx = products.findIndex(p => p.code === incoming.code);

    if (idx >= 0) {
      products[idx] = incoming;
      storage.save(products);
      notify('updated', incoming);
    } else {
      products = [...products, incoming];
      storage.save(products);
      notify('added', incoming);
    }
  },

  remove(code) {
    const normalized = code.toUpperCase();
    products = products.filter(p => p.code !== normalized);
    storage.save(products);
    notify('removed', normalized);
  },

  reset() {
    storage.clear();
    products = storage.load();
    notify('reset', null);
  },

  subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
};
