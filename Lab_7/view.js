function createElement(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

class HeaderView {
  constructor(authElement, staffElements, adminElements) {
    this._auth = authElement;
    this._staff = staffElements;
    this._admin = adminElements;
  }

  render(user) {
    this._staff.forEach((element) => { element.hidden = !user; });
    this._admin.forEach((element) => { element.hidden = !(user && user.role === 'admin'); });
    const link = createElement('a', user ? 'Выйти' : 'Войти');
    link.href = user ? '#home' : '#login';
    if (user) link.dataset.action = 'logout';
    this._auth.replaceChildren();
    if (user) this._auth.append(createElement('span', user.name, 'user'));
    this._auth.append(link);
  }
}

class FilterView {
  constructor(typesElement, authorElement) {
    this._types = typesElement;
    this._author = authorElement;
  }

  renderTypes(types) {
    Object.entries(types).forEach(([value, title]) => {
      const label = createElement('label', undefined, 'choice');
      const input = createElement('input');
      input.type = 'checkbox';
      input.name = 'type';
      input.value = value;
      label.append(input, ` ${title}`);
      this._types.append(label);
    });
  }

  renderAuthors(authors) {
    const selected = this._author.value;
    this._author.replaceChildren();
    const any = createElement('option', 'Любой');
    any.value = '';
    this._author.append(any);
    authors.forEach((author) => {
      const option = createElement('option', author);
      option.value = author;
      this._author.append(option);
    });
    this._author.value = authors.includes(selected) ? selected : '';
  }
}

class CatalogView {
  constructor(listElement, countElement, moreButton, actionsElement) {
    this._list = listElement;
    this._count = countElement;
    this._more = moreButton;
    this._actions = actionsElement;
  }

  render(items, total, user) {
    this._list.replaceChildren(...items.map((item) => this._createItem(item, user)));
    this._count.textContent = `Показано ${items.length} из ${total}`;
    this._more.hidden = items.length >= total;
    this._actions.replaceChildren();
    if (user) {
      const add = createElement('button', 'Добавить компьютер');
      add.type = 'button';
      add.dataset.action = 'add';
      this._actions.append(add);
    }
  }

  _createButton(text, className, action) {
    const button = createElement('button', text, className);
    button.type = 'button';
    button.dataset.action = action;
    return button;
  }

  _createItem(item, user) {
    const li = createElement('li', undefined, 'item');
    li.dataset.id = item.id;

    const info = createElement('div');
    if (item.photoLink) {
      const photo = createElement('img');
      photo.src = item.photoLink;
      photo.alt = item.name;
      info.append(photo);
    }
    const specs = `${ComputerCollection.TYPES[item.type]}. ${item.cores} ядер, ${item.ram} ГБ памяти, накопитель ${item.storage} ГБ.`;
    const date = item.createdAt.toLocaleDateString('ru-RU');
    info.append(
      createElement('h3', item.name),
      createElement('p', specs),
      createElement('p', item.description),
      createElement('p', `Добавил ${item.author}, ${date}`, 'meta')
    );

    const price = createElement('div', undefined, 'price');
    const order = createElement('a', 'Заказать', 'btn small');
    order.href = '#order-new';
    price.append(createElement('strong', `${item.price.toLocaleString('ru-RU')} BYN`), order);
    if (user) {
      const actions = createElement('div', undefined, 'item-actions');
      actions.append(
        this._createButton('Изменить', 'small ghost', 'edit'),
        this._createButton('Удалить', 'small danger', 'delete')
      );
      price.append(actions);
    }

    li.append(info, price);
    return li;
  }
}

class ComputerFormView {
  constructor(formElement, titleElement, errorElement) {
    this._form = formElement;
    this._title = titleElement;
    this._error = errorElement;
    Object.entries(ComputerCollection.TYPES).forEach(([value, title]) => {
      const option = createElement('option', title);
      option.value = value;
      this._field('type').append(option);
    });
  }

  _field(name) {
    return this._form.elements.namedItem(name);
  }

  clear() {
    this._form.reset();
    this._title.textContent = 'Добавление компьютера';
    this.showError('');
  }

  fill(item) {
    this.clear();
    ['name', 'type', 'price', 'cores', 'ram', 'storage', 'description'].forEach((name) => {
      this._field(name).value = item[name];
    });
    this._field('photoLink').value = item.photoLink || '';
    this._title.textContent = 'Редактирование компьютера';
  }

  read() {
    const value = (name) => this._field(name).value.trim();
    return {
      name: value('name'),
      type: value('type'),
      price: Number(value('price')),
      cores: Number(value('cores')),
      ram: Number(value('ram')),
      storage: Number(value('storage')),
      description: value('description'),
      photoLink: value('photoLink')
    };
  }

  showError(text) {
    this._error.textContent = text;
    this._error.hidden = !text;
  }
}

class UsersView {
  constructor(listElement) {
    this._list = listElement;
  }

  render(users, currentUser) {
    this._list.querySelectorAll('li:not(.head)').forEach((li) => li.remove());
    users.forEach((user) => {
      const li = createElement('li');
      li.dataset.id = user.id;
      const actions = createElement('span', undefined, 'row-actions');
      if (!currentUser || user.id !== currentUser.id) {
        const remove = createElement('button', 'Удалить', 'small danger');
        remove.type = 'button';
        remove.dataset.action = 'delete-user';
        actions.append(remove);
      }
      li.append(
        createElement('span', user.name),
        createElement('span', user.email),
        createElement('span', UserCollection.ROLES[user.role]),
        actions
      );
      this._list.append(li);
    });
  }
}
