import { View, html, on } from 'rune-ts';
import { TodoToggled, TodoDeleted } from './events';
import type { TodoItem } from './TodoPage';

export class TodoItemView extends View<TodoItem> {
  override template({ title, completed }: TodoItem) {
    return html`
      <div class="todo-item ${completed ? 'completed' : ''}">
        <div class="todo-checkbox ${completed ? 'checked' : ''}">
          ${completed ? '✓' : ''}
        </div>
        <span class="todo-title">${title}</span>
        <span class="todo-delete">×</span>
      </div>
    `;
  }

  @on('click', '.todo-checkbox')
  private _onToggle() {
    this.data.completed = !this.data.completed;
    this.redraw();
    this.dispatchEvent(TodoToggled, {
      bubbles: true,
      detail: { completed: this.data.completed },
    });
  }

  @on('click', '.todo-delete')
  private _onDelete(e: MouseEvent) {
    e.stopPropagation();
    this.dispatchEvent(TodoDeleted, {
      bubbles: true,
      detail: { id: this.data.id },
    });
  }
}
