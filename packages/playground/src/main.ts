import { TodoPage } from './TodoPage';

const page = new TodoPage({
  todos: [
    { id: 1, title: 'Try the Component Tree panel', completed: false },
    { id: 2, title: 'Inspect view data', completed: false },
    { id: 3, title: 'Watch redraw events', completed: true },
  ],
});

const app = document.getElementById('app')!;
app.appendChild(page.render());
