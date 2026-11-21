class ComputerCollection {
  static TYPES = {
    server: 'Сервер',
    desktop: 'Настольный',
    laptop: 'Портативный',
    handheld: 'Карманный'
  };

  static EDITABLE = ['description', 'photoLink', 'name', 'type', 'price', 'cores', 'ram', 'storage'];

  static SORTABLE = ['id', 'description', 'createdAt', 'author', 'photoLink', 'name', 'type', 'price', 'cores', 'ram', 'storage'];

  constructor(objs = []) {
    this._items = [];
    this.addAll(objs);
  }

  _isText(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  _isCount(value) {
    return Number.isInteger(value) && value > 0;
  }

  _isDate(value) {
    return value instanceof Date && !Number.isNaN(value.getTime());
  }

  _find(id) {
    return this._items.find((item) => item.id === id);
  }

  _matches(item, f) {
    const has = (text, part) => text.toLowerCase().includes(String(part).toLowerCase());
    if (f.id !== undefined && item.id !== f.id) return false;
    if (f.name && !has(item.name, f.name)) return false;
    if (f.description && !has(item.description, f.description)) return false;
    if (f.author && item.author !== f.author) return false;
    if (f.type && ![].concat(f.type).includes(item.type)) return false;
    if (f.priceMin !== undefined && item.price < f.priceMin) return false;
    if (f.priceMax !== undefined && item.price > f.priceMax) return false;
    if (f.coresMin !== undefined && item.cores < f.coresMin) return false;
    if (f.ramMin !== undefined && item.ram < f.ramMin) return false;
    if (f.storageMin !== undefined && item.storage < f.storageMin) return false;
    if (f.dateFrom && item.createdAt < f.dateFrom) return false;
    if (f.dateTo && item.createdAt > f.dateTo) return false;
    if (f.hasPhoto !== undefined && Boolean(item.photoLink) !== f.hasPhoto) return false;
    return true;
  }

  _sort(items, f) {
    const field = ComputerCollection.SORTABLE.includes(f.sortBy) ? f.sortBy : 'createdAt';
    const direction = f.sortOrder === 'asc' ? 1 : -1;
    const value = (item) => {
      const v = item[field];
      if (v instanceof Date) return v.getTime();
      return v === undefined ? '' : v;
    };
    return [...items].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const result = typeof x === 'string'
        ? x.localeCompare(y, 'ru', { numeric: true })
        : x - y;
      return result * direction || a.id.localeCompare(b.id, 'ru', { numeric: true });
    });
  }

  _select(filterConfig) {
    return this._sort(this._items.filter((item) => this._matches(item, filterConfig)), filterConfig);
  }

  getObjs(skip = 0, top = 10, filterConfig = {}) {
    if (!Number.isInteger(skip) || skip < 0) return [];
    if (!Number.isInteger(top) || top <= 0) return [];
    if (!filterConfig || typeof filterConfig !== 'object') return [];
    return this._select(filterConfig).slice(skip, skip + top).map((item) => ({ ...item }));
  }

  size(filterConfig = {}) {
    if (!filterConfig || typeof filterConfig !== 'object') return 0;
    return this._items.filter((item) => this._matches(item, filterConfig)).length;
  }

  getObj(id) {
    if (typeof id !== 'string') return undefined;
    const item = this._find(id);
    return item ? { ...item } : undefined;
  }

  validateObj(obj) {
    if (!obj || typeof obj !== 'object') return false;
    return this._isText(obj.id)
      && this._isText(obj.description) && obj.description.length < 200
      && this._isDate(obj.createdAt)
      && this._isText(obj.author)
      && (obj.photoLink === undefined || typeof obj.photoLink === 'string')
      && this._isText(obj.name)
      && Object.hasOwn(ComputerCollection.TYPES, obj.type)
      && Number.isFinite(obj.price) && obj.price > 0
      && this._isCount(obj.cores)
      && this._isCount(obj.ram)
      && this._isCount(obj.storage);
  }

  addObj(obj) {
    if (!this.validateObj(obj) || this._find(obj.id)) return false;
    this._items.push({ ...obj });
    return true;
  }

  addAll(objs) {
    if (!Array.isArray(objs)) return [];
    return objs.filter((obj) => !this.addObj(obj));
  }

  editObj(id, obj) {
    const item = typeof id === 'string' ? this._find(id) : undefined;
    if (!item || !obj || typeof obj !== 'object') return false;
    const keys = Object.keys(obj);
    if (keys.length === 0 || !keys.every((key) => ComputerCollection.EDITABLE.includes(key))) return false;
    const changed = { ...item, ...obj };
    if (!this.validateObj(changed)) return false;
    Object.assign(item, changed);
    return true;
  }

  removeObj(id) {
    const index = this._items.findIndex((item) => item.id === id);
    if (index === -1) return false;
    this._items.splice(index, 1);
    return true;
  }

  clear() {
    this._items = [];
  }
}
