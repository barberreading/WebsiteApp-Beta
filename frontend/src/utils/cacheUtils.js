// Cache utility to reduce MongoDB connection load
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

class CacheManager {
  constructor() {
    this.cache = {};
  }

  // Get data from cache if available and not expired
  get(key) {
    const item = this.cache[key];
    if (!item) return null;
    
    // Check if cache is expired
    if (Date.now() > item.expiry) {
      delete this.cache[key];
      return null;
    }
    
    return item.data;
  }

  // Store data in cache with expiration
  set(key, data) {
    const expiry = Date.now() + CACHE_DURATION;
    this.cache[key] = { data, expiry };
  }

  // Clear specific cache entry
  clear(key) {
    delete this.cache[key];
  }

  // Clear all cache
  clearAll() {
    this.cache = {};
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

export default cacheManager;