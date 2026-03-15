import React, { useState } from 'react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  createdAt: number;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

interface RelationshipData {
  tasks: Task[];
  notes: Note[];
  partnerName?: string;
  anniversary?: string;
}

interface RelationshipManagerProps {
  data: RelationshipData;
  onUpdate: (updates: Partial<RelationshipData>) => void;
}

export const RelationshipManager: React.FC<RelationshipManagerProps> = ({
  data,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'settings'>('tasks');
  const [newTask, setNewTask] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [taskCategory, setTaskCategory] = useState('Geral');

  const categories = ['Geral', 'Casa', 'Trabalho', 'Pessoal', 'Saúde'];

  const addTask = () => {
    if (!newTask.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      text: newTask,
      completed: false,
      category: taskCategory,
      createdAt: Date.now()
    };

    onUpdate({
      tasks: [task, ...(data.tasks || [])]
    });

    setNewTask('');
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = (data.tasks || []).map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    onUpdate({ tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = (data.tasks || []).filter(task => task.id !== taskId);
    onUpdate({ tasks: updatedTasks });
  };

  const addNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      createdAt: Date.now()
    };

    onUpdate({
      notes: [note, ...(data.notes || [])]
    });

    setNewNote({ title: '', content: '' });
  };

  const deleteNote = (noteId: string) => {
    const updatedNotes = (data.notes || []).filter(note => note.id !== noteId);
    onUpdate({ notes: updatedNotes });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-200 mb-6">Área Relacional</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'tasks', label: 'Tarefas', icon: '✓' },
          { id: 'notes', label: 'Notas', icon: '📝' },
          { id: 'settings', label: 'Configurações', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div>
          {/* Add Task */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Nova tarefa..."
                className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
              />
              <button
                onClick={addTask}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
              >
                Adicionar
              </button>
            </div>
            <select
              value={taskCategory}
              onChange={(e) => setTaskCategory(e.target.value)}
              className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {(data.tasks || []).length === 0 ? (
              <p className="text-center text-slate-500 py-8">Nenhuma tarefa registrada</p>
            ) : (
              (data.tasks || []).map(task => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    task.completed ? 'bg-slate-800/50' : 'bg-slate-800'
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      task.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-slate-500'
                    }`}
                  >
                    {task.completed && '✓'}
                  </button>
                  <div className="flex-1">
                    <p className={`${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.text}
                    </p>
                    <p className="text-xs text-slate-400">{task.category}</p>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div>
          {/* Add Note */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <input
              type="text"
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Título da nota..."
              className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 mb-3"
            />
            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Conteúdo da nota..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 mb-3 resize-none"
            />
            <button
              onClick={addNote}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
            >
              Salvar Nota
            </button>
          </div>

          {/* Notes List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data.notes || []).length === 0 ? (
              <p className="text-center text-slate-500 py-8 col-span-2">Nenhuma nota registrada</p>
            ) : (
              (data.notes || []).map(note => (
                <div key={note.id} className="bg-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-200">{note.title}</h3>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="text-sm text-slate-300 mb-2 whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-slate-500">{formatDate(note.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Configurações do Relacionamento</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nome do Parceiro(a)</label>
              <input
                type="text"
                value={data.partnerName || ''}
                onChange={(e) => onUpdate({ partnerName: e.target.value })}
                placeholder="Digite o nome..."
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Data do Aniversário de Namoro</label>
              <input
                type="date"
                value={data.anniversary || ''}
                onChange={(e) => onUpdate({ anniversary: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
              />
            </div>

            {data.anniversary && (
              <div className="bg-blue-900/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  💕 Próximo aniversário: {(() => {
                    const anni = new Date(data.anniversary);
                    const today = new Date();
                    const nextAnni = new Date(today.getFullYear(), anni.getMonth(), anni.getDate());
                    if (nextAnni < today) {
                      nextAnni.setFullYear(nextAnni.getFullYear() + 1);
                    }
                    const days = Math.ceil((nextAnni.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return `${days} dias`;
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipManager;
