//PATTERN: Memento
export class Memento<T> {
    private state: T;
  
    constructor(state: T) {
      this.state = state;
    }
  
    getState(): T {
      return this.state;
    }
  }
  
export class Caretaker<T> {
    private mementos: Memento<T>[] = [];
    private currentIndex: number = -1;
  
    addMemento(memento: Memento<T>) {
      this.mementos = this.mementos.slice(0, this.currentIndex + 1);
      this.mementos.push(memento);
      this.currentIndex++;
      
    }
  
    undo(): Memento<T> | null {
      if (this.currentIndex <= 0) {
        return null;
      }
      this.currentIndex--;
      return this.mementos[this.currentIndex];
    }
  
    redo(): Memento<T> | null {
      if (this.currentIndex >= this.mementos.length - 1) {
        return null;
      }
      this.currentIndex++;
      return this.mementos[this.currentIndex];
    }
  }