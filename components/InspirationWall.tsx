import React, { useState } from 'react';

interface MuralMessage {
  id: string;
  text: string;
  author: string;
  date: string;
  likes: number;
  color: string;
}

interface InspirationWallProps {
  messages: MuralMessage[];
  onAddMessage: (message: Omit<MuralMessage, 'id' | 'date' | 'likes'>) => void;
  onLikeMessage: (id: string) => void;
}

export const InspirationWall: React.FC<InspirationWallProps> = ({
  messages,
  onAddMessage,
  onLikeMessage
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMessage, setNewMessage] = useState({
    text: '',
    author: '',
    color: '#3B82F6'
  });

  const colors = [
    { hex: '#3B82F6', name: 'Azul' },
    { hex: '#10B981', name: 'Verde' },
    { hex: '#F59E0B', name: 'Amarelo' },
    { hex: '#EF4444', name: 'Vermelho' },
    { hex: '#8B5CF6', name: 'Roxo' },
    { hex: '#EC4899', name: 'Rosa' },
    { hex: '#06B6D4', name: 'Ciano' },
    { hex: '#F97316', name: 'Laranja' }
  ];

  const inspirationalQuotes = [
    "Cada dia é uma nova oportunidade para ser melhor.",
    "A paciência é a chave para a paz interior.",
    "Respire. Você está exatamente onde precisa estar.",
    "Pequenos passos também contam como progresso.",
    "Sua saúde mental é uma prioridade.",
    "A gentileza com você mesmo é revolucionária.",
    "Você é mais forte do que imagina.",
    "O autocuidado não é egoísmo, é necessidade.",
    "Celebre suas vitórias, por menores que sejam.",
    "O bem-estar começa com escolhas conscientes."
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.text.trim() || !newMessage.author.trim()) return;

    onAddMessage({
      text: newMessage.text,
      author: newMessage.author,
      color: newMessage.color
    });

    setNewMessage({ text: '', author: '', color: '#3B82F6' });
    setShowAddForm(false);
  };

  const addRandomQuote = () => {
    const randomQuote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
    setNewMessage(prev => ({ ...prev, text: randomQuote }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-200 mb-2">Mural de Inspirações</h2>
      <p className="text-slate-400 mb-6">Compartilhe pensamentos positivos e inspire outros usuários</p>

      {/* Add Message Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all"
      >
        {showAddForm ? 'Cancelar' : '✨ Compartilhar Inspiração'}
      </button>

      {/* Add Message Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Sua Mensagem</label>
            <textarea
              value={newMessage.text}
              onChange={(e) => setNewMessage(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Compartilhe algo inspirador..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 resize-none"
              required
            />
            <button
              type="button"
              onClick={addRandomQuote}
              className="mt-2 text-sm text-purple-400 hover:text-purple-300"
            >
              🎲 Sugerir frase aleatória
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Seu Nome</label>
            <input
              type="text"
              value={newMessage.author}
              onChange={(e) => setNewMessage(prev => ({ ...prev, author: e.target.value }))}
              placeholder="Como deseja ser identificado?"
              className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Cor do Cartão</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(color => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setNewMessage(prev => ({ ...prev, color: color.hex }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    newMessage.color === color.hex ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Publicar Mensagem
          </button>
        </form>
      )}

      {/* Messages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {messages.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-500 text-lg">Nenhuma mensagem no mural ainda</p>
            <p className="text-slate-600 text-sm mt-2">Seja o primeiro a inspirar!</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className="rounded-xl p-4 relative group"
              style={{ backgroundColor: message.color + '20', borderLeft: `4px solid ${message.color}` }}
            >
              <p className="text-slate-200 mb-3 whitespace-pre-wrap">{message.text}</p>
              
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium" style={{ color: message.color }}>
                    {message.author}
                  </span>
                  <span className="text-slate-500 ml-2">• {formatDate(message.date)}</span>
                </div>
                
                <button
                  onClick={() => onLikeMessage(message.id)}
                  className="flex items-center gap-1 text-slate-400 hover:text-pink-400 transition-colors"
                >
                  <span>❤️</span>
                  <span>{message.likes}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {messages.length > 0 && (
        <div className="mt-6 bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span>Total de mensagens: <strong className="text-slate-200">{messages.length}</strong></span>
            <span>
              Total de curtidas: <strong className="text-slate-200">
                {messages.reduce((sum, m) => sum + m.likes, 0)}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspirationWall;
