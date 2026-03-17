import React, { useState } from 'react';
import { Transaction } from '../types';

interface FinanceManagerProps {
  financeData: {
    transactions: Transaction[];
    balance: number;
    monthlyBudget?: number;
  } | null;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  onDeleteTransaction: (id: string) => void;
  onSetBudget: (budget: number) => void;
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({
  financeData,
  onAddTransaction,
  onDeleteTransaction,
  onSetBudget
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: 'Outros'
  });

  const categories = [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Lazer',
    'Educação',
    'Trabalho',
    'Outros'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.amount || !newTransaction.description) return;

    onAddTransaction({
      type: newTransaction.type,
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
      category: newTransaction.category,
      month: new Date().toISOString().slice(0, 7) // YYYY-MM format
    });

    setNewTransaction({
      type: 'expense',
      amount: '',
      description: '',
      category: 'Outros'
    });
    setShowAddForm(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-200 mb-6">Gerenciamento Financeiro</h2>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 mb-6 text-white">
        <p className="text-sm opacity-90 mb-1">Saldo Atual</p>
        <p className="text-3xl font-bold">{formatCurrency(financeData?.balance || 0)}</p>
      </div>

      {/* Add Transaction Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full mb-6 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
      >
        {showAddForm ? 'Cancelar' : '+ Nova Transação'}
      </button>

      {/* Add Transaction Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tipo</label>
              <select
                value={newTransaction.type}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Valor</label>
              <input
                type="number"
                step="0.01"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0,00"
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Categoria</label>
              <select
                value={newTransaction.category}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Descrição</label>
              <input
                type="text"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Supermercado"
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            Salvar Transação
          </button>
        </form>
      )}

      {/* Transactions List */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Últimas Transações</h3>
        
        {financeData?.transactions && financeData.transactions.length > 0 ? (
          <div className="space-y-3">
            {financeData.transactions.slice(0, 10).map(transaction => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-200">{transaction.description}</p>
                  <p className="text-sm text-slate-400">{transaction.category} • {transaction.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${
                    transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                  <button
                    onClick={() => onDeleteTransaction(transaction.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">Nenhuma transação registrada</p>
        )}
      </div>
    </div>
  );
};

export default FinanceManager;
