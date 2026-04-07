import { Page, html, on } from 'rune-ts';
import { TodoListView } from './TodoListView';
import { TodoItemView } from './TodoItemView';
import { TodoToggled, TodoDeleted } from './events';

interface TodoPageData {
  todos: TodoItem[];
}

export interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
}

export class TodoPage extends Page<TodoPageData> {
  private _nextId = 100;

  override template({ todos }: TodoPageData) {
    return html`
      <div class="app-container">
        <h1><span>Rune</span> DevTools Playground</h1>
        <div class="todo-input-row">
          <input type="text" placeholder="Add a new todo..." class="todo-input" />
          <button class="todo-add-btn">Add</button>
        </div>
        ${new TodoListView(todos)}
        <div class="todo-footer">
          <span class="todo-count">${todos.filter((t) => !t.completed).length} items left</span>
          <button class="todo-clear-btn">Clear completed</button>
        </div>
      </div>
    `;
  }

  @on('click', '.todo-add-btn')
  private _onAdd() {
    const input = this.element().querySelector('.todo-input') as HTMLInputElement;
    const title = input.value.trim();
    if (!title) return;

    const listView = this.subView(TodoListView)!;
    listView.append({ id: this._nextId++, title, completed: false });
    input.value = '';
    this._updateFooter();
  }

  @on('keydown', '.todo-input')
  private _onInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') this._onAdd();
  }

  @on(TodoToggled)
  private _onToggle() {
    this._updateFooter();
  }

  @on(TodoDeleted)
  private _onDelete(e: InstanceType<typeof TodoDeleted>) {
    const listView = this.subView(TodoListView)!;
    const itemView = listView.itemViews.find((v) => v.data.id === e.detail.id);
    if (itemView) {
      listView.removeByItemView(itemView);
      this._updateFooter();
    }
  }

  @on('click', '.todo-clear-btn')
  private _onClearCompleted() {
    const listView = this.subView(TodoListView)!;
    const completed = listView.itemViews.filter((v) => v.data.completed);
    if (completed.length > 0) {
      listView.removeAllByItemViews(completed);
      this._updateFooter();
    }
  }

  private _updateFooter() {
    const listView = this.subView(TodoListView)!;
    const remaining = listView.itemViews.filter((v) => !v.data.completed).length;
    const countEl = this.element().querySelector('.todo-count');
    if (countEl) countEl.textContent = `${remaining} items left`;
  }
}
