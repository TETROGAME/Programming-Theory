(function () {
  const PAGE_SIZE = 10;
  const SESSION_KEY = 'session';
  const SORTS = {
    'date-desc': { sortBy: 'createdAt', sortOrder: 'desc' },
    'price-asc': { sortBy: 'price', sortOrder: 'asc' },
    'price-desc': { sortBy: 'price', sortOrder: 'desc' },
    name: { sortBy: 'name', sortOrder: 'asc' }
  };
  const ACCESS = {
    orders: 'user',
    'order-edit': 'user',
    'order-delete': 'user',
    'computer-form': 'user',
    users: 'admin'
  };

  const byId = (id) => document.getElementById(id);

  const computers = new ComputerCollection();
  if (!computers.restore()) {
    computers.addAll(ObjInf);
    computers.save();
  }
  const users = new UserCollection();
  if (!users.restore()) {
    users.addAll(USERS);
    users.save();
  }

  const state = {
    user: users.getUser(localStorage.getItem(SESSION_KEY)),
    filter: {},
    shown: PAGE_SIZE,
    editingId: null
  };

  const header = new HeaderView(
    byId('auth'),
    document.querySelectorAll('[data-auth]'),
    document.querySelectorAll('[data-admin]')
  );
  const filters = new FilterView(byId('filter-types'), byId('filter-author'));
  const catalog = new CatalogView(byId('items'), byId('count'), byId('more'), byId('staff-actions'));
  const computerForm = new ComputerFormView(byId('computer-edit'), byId('computer-title'), byId('computer-error'));
  const usersView = new UsersView(byId('users-list'));

  function allComputers() {
    return computers.getObjs(0, Math.max(computers.size(), 1));
  }

  function nextId(items) {
    return String(Math.max(0, ...items.map((item) => Number(item.id))) + 1);
  }

  function render() {
    header.render(state.user);
    const authors = [...new Set(allComputers().map((item) => item.author))].sort();
    filters.renderAuthors(authors);
    catalog.render(computers.getObjs(0, state.shown, state.filter), computers.size(state.filter), state.user);
    usersView.render(users.getUsers(), state.user);
  }

  function readFilter() {
    const filter = {};
    const panel = new FormData(byId('filters-form'));
    const types = panel.getAll('type');
    if (types.length > 0) filter.type = types;
    if (panel.get('author')) filter.author = panel.get('author');
    const priceMax = parseFloat(panel.get('pmax'));
    if (!Number.isNaN(priceMax)) filter.priceMax = priceMax;
    const search = new FormData(byId('search-form'));
    const query = search.get('q').trim();
    if (query) filter.name = query;
    return Object.assign(filter, SORTS[search.get('sort')]);
  }

  function applyFilter() {
    state.filter = readFilter();
    state.shown = PAGE_SIZE;
    render();
  }

  function checkAccess() {
    const need = ACCESS[location.hash.slice(1)];
    if (!need) return;
    if (!state.user) {
      location.hash = '#login';
    } else if (need === 'admin' && state.user.role !== 'admin') {
      location.hash = '#home';
    }
  }

  function openComputerForm(id) {
    state.editingId = id;
    if (id) computerForm.fill(computers.getObj(id));
    else computerForm.clear();
    location.hash = '#computer-form';
  }

  function showError(element, text) {
    element.textContent = text;
    element.hidden = !text;
  }

  byId('login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const found = users.authenticate(data.get('mail').trim(), data.get('pass'));
    const error = byId('login-error');
    if (!found) {
      showError(error, 'Неверная почта или пароль.');
      return;
    }
    showError(error, '');
    event.currentTarget.reset();
    state.user = found;
    localStorage.setItem(SESSION_KEY, found.id);
    render();
    location.hash = '#home';
  });

  byId('auth').addEventListener('click', (event) => {
    if (!event.target.closest('[data-action="logout"]')) return;
    state.user = null;
    state.editingId = null;
    localStorage.removeItem(SESSION_KEY);
    render();
  });

  byId('filters-form').addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilter();
  });

  byId('filters-form').addEventListener('reset', () => setTimeout(applyFilter, 0));

  byId('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilter();
  });

  byId('more').addEventListener('click', () => {
    state.shown += PAGE_SIZE;
    render();
  });

  byId('staff-actions').addEventListener('click', (event) => {
    if (event.target.closest('[data-action="add"]')) openComputerForm(null);
  });

  byId('items').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button || !state.user) return;
    const id = button.closest('.item').dataset.id;
    if (button.dataset.action === 'edit') {
      openComputerForm(id);
    } else if (button.dataset.action === 'delete' && confirm('Удалить этот компьютер из каталога?')) {
      if (computers.removeObj(id)) {
        computers.save();
        render();
      }
    }
  });

  byId('computer-edit').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!state.user) return;
    const data = computerForm.read();
    const saved = state.editingId
      ? computers.editObj(state.editingId, data)
      : computers.addObj({
        ...data,
        id: nextId(allComputers()),
        createdAt: new Date(),
        author: state.user.name
      });
    if (!saved) {
      computerForm.showError('Не удалось сохранить: заполните все поля, числа должны быть больше нуля, описание короче 200 символов.');
      return;
    }
    computers.save();
    state.editingId = null;
    computerForm.clear();
    render();
    location.hash = '#home';
  });

  byId('user-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const added = users.addUser({
      id: nextId(users.getUsers()),
      name: data.get('name').trim(),
      email: data.get('mail').trim(),
      password: data.get('pass'),
      role: data.get('role')
    });
    if (!added) {
      showError(byId('user-error'), 'Не удалось добавить: проверьте данные, почта не должна повторяться.');
      return;
    }
    users.save();
    showError(byId('user-error'), '');
    form.reset();
    render();
  });

  byId('users-list').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="delete-user"]');
    if (!button) return;
    if (confirm('Удалить этого пользователя?') && users.removeUser(button.closest('li').dataset.id)) {
      users.save();
      render();
    }
  });

  window.addEventListener('hashchange', checkAccess);

  filters.renderTypes(ComputerCollection.TYPES);
  render();
  checkAccess();
})();
