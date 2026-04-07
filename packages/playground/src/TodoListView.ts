import { ListView } from 'rune-ts';
import { TodoItemView } from './TodoItemView';
import type { TodoItem } from './TodoPage';

export class TodoListView extends ListView<TodoItemView> {
  ItemView = TodoItemView;
}
