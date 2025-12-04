import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Download, Settings, PieChart, 
  TrendingUp, DollarSign, Users, Save, RefreshCw 
} from 'lucide-react';

// --- COMPOSANTS GRAPHIQUES SIMPLES (SVG) ---
// Nous utilisons des SVG natifs pour garantir un fonctionnement sans dépendance externe (npm install recharts etc.)

const SimplePieChart = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulativePercent = 0;

  if (total === 0) return <div className="text-gray-400 text-sm text-center py-10">Pas de données</div>;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="flex items-center gap-8">
      <svg viewBox="-1 -1 2 2" className="w-48 h-48 transform -rotate-90">
        {data.map((slice, i) => {
          const start = cumulativePercent;
          const slicePercent = slice.value / total;
          cumulativePercent += slicePercent;
          const end = cumulativePercent;

          const [startX, startY] = getCoordinatesForPercent(start);
          const [endX, endY] = getCoordinatesForPercent(end);
          
          const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
          const pathData = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;

          return (
            <path key={i} d={pathData} fill={slice.color} stroke="white" strokeWidth="0.02" />
          );
        })}
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
            <span className="font-medium text-gray-700">{item.name}</span>
            <span className="text-gray-500">({Math.round(item.value / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BalanceBar = ({ user1, user2, balance }) => {
  // balance > 0 : User 1 doit à User 2
  // balance < 0 : User 2 doit à User 1
  const max = Math.max(Math.abs(balance), 1000); // Échelle arbitraire min 1000
  const width = Math.min(Math.abs(balance) / max * 100, 100); 
  
  return (
    <div className="w-full mt-4">
      <div className="flex justify-between text-sm font-medium mb-2">
        <span>{user1} doit recevoir</span>
        <span>{user2} doit recevoir</span>
      </div>
      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
        <div className="absolute w-0.5 h-full bg-gray-400 z-10"></div>
        {balance < 0 ? (
           <div 
             className="absolute left-1/2 h-full bg-blue-500 rounded-r-full transition-all duration-500"
             style={{ width: `${width/2}%`, marginLeft: '0' }}
           />
        ) : (
          <div 
            className="absolute right-1/2 h-full bg-pink-500 rounded-l-full transition-all duration-500"
            style={{ width: `${width/2}%`, marginRight: '0' }}
          />
        )}
        <span className="relative z-20 text-xs font-bold text-gray-700 bg-white/80 px-2 rounded">
          {Math.abs(balance).toFixed(0)} €
        </span>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{balance < 0 ? `Si la barre est bleue, ${user2} doit payer ${user1}` : ""}</span>
        <span>{balance > 0 ? `Si la barre est rose, ${user1} doit payer ${user2}` : ""}</span>
      </div>
    </div>
  );
};

// --- APPLICATION PRINCIPALE ---

const BudgetPlanner = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, expenses, settings
  
  // Configuration Utilisateurs
  const [users, setUsers] = useState({
    user1: { name: 'Moi', salary: 2500, color: '#3B82F6' }, // Blue
    user2: { name: 'Partenaire', salary: 2300, color: '#EC4899' } // Pink
  });

  // Calcul du ratio basé sur les salaires
  const ratio = useMemo(() => {
    const total = users.user1.salary + users.user2.salary;
    if (total === 0) return 0.5;
    return users.user1.salary / total;
  }, [users]);

  // Données initiales
  const initialExpenses = [
    { id: 1, category: 'Logement', label: 'Loyer', amount: 1200, frequency: 'monthly', payer: 'joint', split: 'ratio' },
    { id: 2, category: 'Alimentation', label: 'Courses', amount: 450, frequency: 'monthly', payer: 'joint', split: '50-50' },
    { id: 3, category: 'Transports', label: 'Essence', amount: 100, frequency: 'monthly', payer: 'user1', split: '100-user1' },
    { id: 4, category: 'Abonnements', label: 'Netflix', amount: 18, frequency: 'monthly', payer: 'user2', split: 'ratio' },
  ];

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('budget_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [newExpense, setNewExpense] = useState({ 
    category: 'Divers', 
    label: '', 
    amount: '', 
    frequency: 'monthly', 
    payer: 'joint', // Qui a sorti la CB ? (joint, user1, user2)
    split: 'ratio'  // Qui consomme ? (ratio, 50-50, 100-user1, 100-user2)
  });

  // Persistance locale (simulation BDD)
  useEffect(() => {
    localStorage.setItem('budget_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // --- LOGIQUE MÉTIER ---

  const getMonthlyCost = (amount, frequency) => {
    const num = parseFloat(amount) || 0;
    if (frequency === 'monthly') return num;
    if (frequency === 'quarterly') return num / 3;
    if (frequency === 'annual') return num / 12;
    return 0;
  };

  // Calculs financiers lourds
  const financialData = useMemo(() => {
    let total = 0;
    let byCategory = {};
    
    // Pour l'équilibrage : combien chacun AURAIT DU payer vs combien il A PAYÉ
    let paidBy1 = 0;
    let paidBy2 = 0;
    let shouldPay1 = 0;
    let shouldPay2 = 0;

    expenses.forEach(e => {
      const cost = getMonthlyCost(e.amount, e.frequency);
      total += cost;

      // Catégories
      if (!byCategory[e.category]) byCategory[e.category] = 0;
      byCategory[e.category] += cost;

      // 1. Qui a payé réellement ?
      if (e.payer === 'user1') paidBy1 += cost;
      else if (e.payer === 'user2') paidBy2 += cost;
      else if (e.payer === 'joint') {
        // Si c'est le compte joint, on considère que c'est neutre pour l'équilibrage
        // OU on considère que chacun a mis sa part.
        // Simplification : On ignore le compte joint pour la dette entre personnes, 
        // on ne regarde que ce que l'un a avancé pour l'autre.
      }

      // 2. Qui AURAIT DÛ payer ? (Théorie)
      let share1 = 0;
      let share2 = 0;

      if (e.split === '50-50') {
        share1 = cost * 0.5;
        share2 = cost * 0.5;
      } else if (e.split === 'ratio') {
        share1 = cost * ratio;
        share2 = cost * (1 - ratio);
      } else if (e.split === '100-user1') {
        share1 = cost;
      } else if (e.split === '100-user2') {
        share2 = cost;
      }

      // Si c'est payé par le compte joint, on assume que l'argent dessus 
      // respecte déjà le split (c'est le but du compte joint).
      // Donc l'équilibrage ne concerne que les paiements perso qui auraient dû être partagés.
      if (e.payer !== 'joint') {
        shouldPay1 += share1;
        shouldPay2 += share2;
      }
    });

    // La balance : Positive = User1 doit de l'argent. Négative = User2 doit.
    // Formule : (Ce que j'aurais dû payer) - (Ce que j'ai payé)
    const balance = shouldPay1 - paidBy1; 

    // Données Pie Chart
    const pieData = Object.keys(byCategory).map((cat, index) => ({
      name: cat,
      value: byCategory[cat],
      color: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#6B7280'][index % 6]
    }));

    return { total, pieData, balance, paidBy1, paidBy2, shouldPay1, shouldPay2 };
  }, [expenses, ratio]);

  // --- ACTIONS ---

  const handleAdd = () => {
    if (!newExpense.label || !newExpense.amount) return;
    setExpenses([...expenses, { ...newExpense, id: Date.now(), amount: parseFloat(newExpense.amount) }]);
    setNewExpense({ ...newExpense, label: '', amount: '' });
  };

  const handleDelete = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(expenses, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "budget_backup.json";
    link.click();
  };

  // --- RENDU ---

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <span className="font-bold text-xl flex items-center gap-2 text-indigo-600">
              <PieChart className="w-6 h-6" /> DuoBudget
            </span>
            <div className="flex space-x-4">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('expenses')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'expenses' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Dépenses
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Réglages
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        
        {/* --- ONGLET SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Profils & Revenus
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User 1 */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <label className="block text-sm font-medium text-blue-800 mb-1">Nom (Vous)</label>
                <input 
                  type="text" 
                  value={users.user1.name}
                  onChange={(e) => setUsers({...users, user1: {...users.user1, name: e.target.value}})}
                  className="w-full p-2 border border-blue-200 rounded mb-3"
                />
                <label className="block text-sm font-medium text-blue-800 mb-1">Salaire Net Mensuel</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={users.user1.salary}
                    onChange={(e) => setUsers({...users, user1: {...users.user1, salary: parseFloat(e.target.value) || 0}})}
                    className="w-full p-2 border border-blue-200 rounded"
                  />
                  <span className="absolute right-3 top-2 text-blue-400">€</span>
                </div>
              </div>

              {/* User 2 */}
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                <label className="block text-sm font-medium text-pink-800 mb-1">Nom (Partenaire)</label>
                <input 
                  type="text" 
                  value={users.user2.name}
                  onChange={(e) => setUsers({...users, user2: {...users.user2, name: e.target.value}})}
                  className="w-full p-2 border border-pink-200 rounded mb-3"
                />
                <label className="block text-sm font-medium text-pink-800 mb-1">Salaire Net Mensuel</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={users.user2.salary}
                    onChange={(e) => setUsers({...users, user2: {...users.user2, salary: parseFloat(e.target.value) || 0}})}
                    className="w-full p-2 border border-pink-200 rounded"
                  />
                  <span className="absolute right-3 top-2 text-pink-400">€</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500 mb-1">Répartition proportionnelle calculée :</p>
              <div className="flex items-center justify-center gap-4 text-xl font-bold">
                <span className="text-blue-600">{(ratio * 100).toFixed(0)}%</span>
                <span className="text-gray-300">/</span>
                <span className="text-pink-600">{(100 - ratio * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="mt-6 border-t pt-4">
               <button onClick={handleExport} className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600">
                 <Download className="w-4 h-4" /> Sauvegarder les données (JSON)
               </button>
            </div>
          </div>
        )}

        {/* --- ONGLET DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow text-white p-6 col-span-1 md:col-span-3">
              <h3 className="text-indigo-100 font-medium mb-1">Budget Mensuel Total</h3>
              <div className="text-4xl font-bold mb-2">{financialData.total.toFixed(0)} €</div>
              <p className="text-sm opacity-80">
                Dont {financialData.pieData.find(d => d.name === 'Logement')?.value.toFixed(0) || 0} € de logement
              </p>
            </div>

            {/* Repartition Camembert */}
            <div className="bg-white rounded-xl shadow p-6 md:col-span-2">
              <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-500" />
                Répartition par Catégorie
              </h3>
              <div className="flex justify-center">
                <SimplePieChart data={financialData.pieData} />
              </div>
            </div>

            {/* Equilibrage */}
            <div className="bg-white rounded-xl shadow p-6 md:col-span-1">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-green-500" />
                Équilibrage (hors compte joint)
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Basé sur les dépenses avancées par chacun avec leurs cartes perso vs la part théorique due.
              </p>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{users.user1.name} a avancé</span>
                  <span className="font-medium">{financialData.paidBy1.toFixed(0)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{users.user2.name} a avancé</span>
                  <span className="font-medium">{financialData.paidBy2.toFixed(0)} €</span>
                </div>
                <div className="border-t pt-2">
                   <BalanceBar 
                     user1={users.user1.name} 
                     user2={users.user2.name} 
                     balance={financialData.balance} 
                   />
                   <div className="mt-4 text-center font-bold text-lg text-indigo-800">
                     {financialData.balance > 0 
                       ? `${users.user1.name} doit ${Math.abs(financialData.balance).toFixed(2)}€ à ${users.user2.name}`
                       : Math.abs(financialData.balance) < 1 
                         ? "Comptes équilibrés"
                         : `${users.user2.name} doit ${Math.abs(financialData.balance).toFixed(2)}€ à ${users.user1.name}`
                     }
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ONGLET DEPENSES --- */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            
            {/* Input Form */}
            <div className="bg-white p-4 rounded-xl shadow border border-indigo-50">
              <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Ajouter une dépense
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs text-gray-500 uppercase font-bold">Quoi ?</label>
                  <select 
                    className="w-full p-2 border rounded bg-gray-50 text-sm mt-1"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  >
                    <option>Logement</option>
                    <option>Alimentation</option>
                    <option>Transports</option>
                    <option>Abonnements</option>
                    <option>Santé</option>
                    <option>Loisirs</option>
                  </select>
                </div>
                
                <div className="col-span-2 md:col-span-2">
                  <label className="text-xs text-gray-500 uppercase font-bold">Détail</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Facture EDF" 
                    className="w-full p-2 border rounded bg-gray-50 text-sm mt-1"
                    value={newExpense.label}
                    onChange={(e) => setNewExpense({...newExpense, label: e.target.value})}
                  />
                </div>
                
                <div className="col-span-1">
                   <label className="text-xs text-gray-500 uppercase font-bold">Montant</label>
                   <input 
                    type="number" 
                    placeholder="€" 
                    className="w-full p-2 border rounded bg-gray-50 text-sm mt-1"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-xs text-gray-500 uppercase font-bold">Fréquence</label>
                  <select 
                    className="w-full p-2 border rounded bg-gray-50 text-sm mt-1"
                    value={newExpense.frequency}
                    onChange={(e) => setNewExpense({...newExpense, frequency: e.target.value})}
                  >
                    <option value="monthly">Mensuelle</option>
                    <option value="quarterly">Trimestrielle</option>
                    <option value="annual">Annuelle</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-2">
                   <label className="text-xs text-gray-500 uppercase font-bold">Paiement & Partage</label>
                   <div className="flex gap-2 mt-1">
                      <select 
                        className="w-1/2 p-2 border rounded bg-gray-50 text-sm"
                        value={newExpense.payer}
                        onChange={(e) => setNewExpense({...newExpense, payer: e.target.value})}
                      >
                        <option value="joint">Payé via Compte Joint</option>
                        <option value="user1">Avancé par {users.user1.name}</option>
                        <option value="user2">Avancé par {users.user2.name}</option>
                      </select>
                      <select 
                        className="w-1/2 p-2 border rounded bg-gray-50 text-sm"
                        value={newExpense.split}
                        onChange={(e) => setNewExpense({...newExpense, split: e.target.value})}
                      >
                        <option value="ratio">Partage Propor. Salaire</option>
                        <option value="50-50">Partage 50/50</option>
                        <option value="100-user1">100% pour {users.user1.name}</option>
                        <option value="100-user2">100% pour {users.user2.name}</option>
                      </select>
                   </div>
                </div>

                <div className="col-span-2 md:col-span-6 flex justify-end">
                   <button 
                    onClick={handleAdd}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-6 py-2 font-medium transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="p-4">Dépense</th>
                    <th className="p-4 text-right">Montant</th>
                    <th className="p-4 hidden md:table-cell">Qui paie ?</th>
                    <th className="p-4 hidden md:table-cell">Répartition</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{e.label}</div>
                        <div className="text-xs text-gray-500">{e.category} • {e.frequency === 'monthly' ? 'Mensuel' : 'Annuel'}</div>
                      </td>
                      <td className="p-4 text-right font-bold text-indigo-600">
                        {getMonthlyCost(e.amount, e.frequency).toFixed(2)} €
                        <div className="text-xs font-normal text-gray-400">/mois</div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          e.payer === 'joint' ? 'bg-gray-100 text-gray-600' :
                          e.payer === 'user1' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                        }`}>
                          {e.payer === 'joint' ? 'Compte Joint' : e.payer === 'user1' ? users.user1.name : users.user2.name}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell text-gray-500 text-xs">
                        {e.split === 'ratio' ? 'Proportionnel' : e.split === '50-50' ? '50 / 50' : `Perso (${e.split.replace('100-', '')})`}
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleDelete(e.id)} className="text-red-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default BudgetPlanner;
