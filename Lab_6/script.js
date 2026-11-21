let user = 'Иванов Иван';

const app = (function () {
  const PAGE_SIZE = 10;
  const state = { filter: {}, shown: PAGE_SIZE };

  const collection = new ComputerCollection(ObjInf);
  const header = new HeaderView(
    document.getElementById('auth'),
    document.querySelectorAll('[data-auth]')
  );
  const filters = new FilterView(
    document.getElementById('filter-types'),
    document.getElementById('filter-author')
  );
  const catalog = new CatalogView(
    document.getElementById('items'),
    document.getElementById('count'),
    document.getElementById('more'),
    document.getElementById('staff-actions')
  );

  function refresh() {
    const items = collection.getObjs(0, state.shown, state.filter);
    catalog.render(items, collection.size(state.filter), user);
  }

  function nextId() {
    const ids = collection.getObjs(0, Math.max(collection.size(), 1)).map((item) => Number(item.id));
    return String(Math.max(0, ...ids) + 1);
  }

  function addObj(obj) {
    if (!user) return false;
    const full = { id: nextId(), createdAt: new Date(), author: user, ...obj };
    const added = collection.addObj(full);
    if (added) refresh();
    return added;
  }

  function editObj(id, obj) {
    if (!user) return false;
    const edited = collection.editObj(id, obj);
    if (edited) refresh();
    return edited;
  }

  function removeObj(id) {
    if (!user) return false;
    const removed = collection.removeObj(id);
    if (removed) refresh();
    return removed;
  }

  function applyFilter(filterConfig) {
    state.filter = filterConfig || {};
    state.shown = PAGE_SIZE;
    refresh();
  }

  function showMore() {
    state.shown += PAGE_SIZE;
    refresh();
  }

  function setUser(name) {
    user = name || null;
    header.render(user);
    refresh();
  }

  const authors = [...new Set(collection.getObjs(0, Math.max(collection.size(), 1)).map((item) => item.author))].sort();
  filters.render(ComputerCollection.TYPES, authors);
  header.render(user);
  refresh();

  return { collection, addObj, editObj, removeObj, applyFilter, showMore, setUser };
})();

Object.assign(window, app);
