function createElement(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

class HeaderView {
  constructor(authElement, staffElements) {
    this._auth = authElement;
    this._staff = staffElements;
  }

  render(user) {
    this._staff.forEach((element) => { element.hidden = !user; });
    const link = createElement('a', user ? 'Выйти' : 'Войти');
    link.href = '#login';
    this._auth.replaceChildren();
    if (user) this._auth.append(createElement('span', user, 'user'));
    this._auth.append(link);
  }
}

class FilterView {
  constructor(typesElement, authorElement) {
    this._types = typesElement;
    this._author = authorElement;
  }

  render(types, authors) {
    this._types.querySelectorAll('label').forEach((label) => label.remove());
    Object.entries(types).forEach(([value, title]) => {
      const label = createElement('label', undefined, 'choice');
      const input = createElement('input');
      input.type = 'checkbox';
      input.name = 'type';
      input.value = value;
      label.append(input, ` ${title}`);
      this._types.append(label);
    });
    this._author.replaceChildren();
    const any = createElement('option', 'Любой');
    any.value = '';
    this._author.append(any);
    authors.forEach((author) => {
      const option = createElement('option', author);
      option.value = author;
      this._author.append(option);
    });
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
      this._actions.append(add);
    }
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
      const edit = createElement('button', 'Изменить', 'small ghost');
      const remove = createElement('button', 'Удалить', 'small danger');
      edit.type = 'button';
      remove.type = 'button';
      price.append(createElement('div', undefined, 'item-actions'));
      price.lastChild.append(edit, remove);
    }

    li.append(info, price);
    return li;
  }
}
