import { randomUUID } from 'crypto';

import { Card } from './card';

class List {
  public id: string;

  public name: string;

  public cards: Card[] = [];

  public constructor(name: string) {
    this.name = name;
    this.id = randomUUID();
    
  }

  setCards(cards: Card[]) {
    this.cards = cards;

    return this;
  }
  //PATTERN: Prototype
  clone(): List {
    return new List(this.name).setCards([...this.cards]);
  }

  setName(name: string) {
    this.name = name;
    return this;
  }
}

export { List };
