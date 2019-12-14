export default class SequentialCharacterGenerator {
  _chars: string;
  _nextId: [number];

  constructor(chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    this._chars = chars;
    this._nextId = [0];
  }

  next() {
    const r = [];
    for (const char of this._nextId) {
      r.unshift(this._chars[char]);
    }
    this._increment();
    return r.join('');
  }

  _increment() {
    for (let i = 0; i < this._nextId.length; i++) {
      const val = ++this._nextId[i];
      if (val >= this._chars.length) {
        this._nextId[i] = 0;
      } else {
        return;
      }
    }
    this._nextId.push(0);
  }

  *[Symbol.iterator]() {
    while (true) {
      yield this.next();
    }
  }
}
