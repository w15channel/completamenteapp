import { useState, useEffect, useCallback } from 'react';
import { FinancasData, Transaction } from '../types';
import { DateUtils } from '../utils/dateUtils';

export const useFinance = (userId: string) => {
  const [financeData, setFinanceData] = useState<FinancasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load finance data from localStorage
  const loadFinanceData = useCallback(() => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const stored = localStorage.getItem(`wr_finance_${userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setFinanceData(data);
      } else {
        // Initialize empty finance data
        setFinanceData({
          transactions: [],
          balance: 0,
          monthlyBudget: 0
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading finance data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Save finance data
  const saveFinanceData = useCallback((data: FinancasData) => {
    if (!userId) return;

    try {
      localStorage.setItem(`wr_finance_${userId}`, JSON.stringify(data));
      setFinanceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving finance data');
    }
  }, [userId]);

  // Add transaction
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'date'>) => {
    if (!financeData) return;

    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      date: DateUtils.getTodayStr()
    };

    const updatedTransactions = [newTransaction, ...financeData.transactions];
    
    // Calculate new balance
    const newBalance = updatedTransactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);

    const updatedData: FinancasData = {
      ...financeData,
      transactions: updatedTransactions,
      balance: newBalance
    };

    saveFinanceData(updatedData);
  }, [financeData, saveFinanceData]);

  // Delete transaction
  const deleteTransaction = useCallback((transactionId: string) => {
    if (!financeData) return;

    const updatedTransactions = financeData.transactions.filter(t => t.id !== transactionId);
    
    // Recalculate balance
    const newBalance = updatedTransactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);

    const updatedData: FinancasData = {
      ...financeData,
      transactions: updatedTransactions,
      balance: newBalance
    };

    saveFinanceData(updatedData);
  }, [financeData, saveFinanceData]);

  // Get monthly summary
  const getMonthlySummary = useCallback((month?: string) => {
    if (!financeData?.transactions) return { income: 0, expenses: 0, balance: 0 };

    const targetMonth = month || DateUtils.getMonthStr();
    
    const monthlyTransactions = financeData.transactions.filter(t => 
      t.date.startsWith(targetMonth)
    );

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses
    };
  }, [financeData]);

  // Get category breakdown
  const getCategoryBreakdown = useCallback(() => {
    if (!financeData?.transactions) return {};

    const expenses = financeData.transactions.filter(t => t.type === 'expense');
    
    const breakdown: Record<string, number> = {};
    expenses.forEach(t => {
      const category = t.category || 'Outros';
      breakdown[category] = (breakdown[category] || 0) + t.amount;
    });

    return breakdown;
  }, [financeData]);

  // Set monthly budget
  const setMonthlyBudget = useCallback((budget: number) => {
    if (!financeData) return;

    const updatedData: FinancasData = {
      ...financeData,
      monthlyBudget: budget
    };

    saveFinanceData(updatedData);
  }, [financeData, saveFinanceData]);

  // Load data on mount
  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  return {
    financeData,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    getMonthlySummary,
    getCategoryBreakdown,
    setMonthlyBudget,
    refreshData: loadFinanceData
  };
};

export default useFinance;
