import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UsersWithContracts.css';

// Define interfaces for our data types
interface Contract {
  _id: string;
  policyType: string;
  startDate: string;
  endDate: string;
  premiumAmount: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  contracts: Contract[];
}

interface PolicyTypeOption {
  value: string;
  label: string;
}

interface PolicyCount {
  type: string;
  count: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: User[];
}

const UsersWithContracts: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicyType, setSelectedPolicyType] = useState<string>('');
  const [policyCounts, setPolicyCounts] = useState<PolicyCount[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const policyTypes: PolicyTypeOption[] = [
    { value: '', label: 'Tous les types' },
    { value: 'santé', label: 'Santé' },
    { value: 'voyage', label: 'Voyage' },
    { value: 'automobile', label: 'Automobile' },
    { value: 'responsabilité civile', label: 'Responsabilité Civile' },
    { value: 'habitation', label: 'Habitation' },
    { value: 'professionnelle', label: 'Professionnelle' },
    { value: 'transport', label: 'Transport' }
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication token not found. Please login again.');
          setLoading(false);
          return;
        }

        const url = selectedPolicyType 
          ? `http://localhost:5000/api/supervisor/users-with-contracts-only?policyType=${encodeURIComponent(selectedPolicyType)}`
          : 'http://localhost:5000/api/supervisor/users-with-contracts-only';

        const response = await axios.get<ApiResponse>(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.data.success || !Array.isArray(response.data.data)) {
          throw new Error("Invalid API response format");
        }

        setUsers(response.data.data);
        
        // Calculate policy type counts
        const counts: PolicyCount[] = [];
        policyTypes.forEach(policyType => {
          if (policyType.value) { // Skip "All types" option
            const count = response.data.data.filter(user => 
              user.contracts.some(contract => contract.policyType === policyType.value)
            ).length;
            counts.push({ type: policyType.label, count });
          }
        });
        setPolicyCounts(counts);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users with contracts:', err);
        const errorMessage = axios.isAxiosError(err) 
          ? err.response?.data?.message || 'Failed to fetch users' 
          : 'An unknown error occurred';
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [selectedPolicyType]);

  const handlePolicyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPolicyType(e.target.value);
    // Reset expanded state when changing filters
    setExpandedUsers({});
  };

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPolicyTypeIcon = (type: string): string => {
    switch(type) {
      case 'santé': return '🩺';
      case 'voyage': return '✈️';
      case 'automobile': return '🚗';
      case 'habitation': return '🏠';
      case 'transport': return '📦';
      case 'responsabilité civile': return '🧑‍⚖️';
      case 'professionnelle': return '💼';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="uwc-container">
        <h2 className="uwc-title">Chargement des utilisateurs...</h2>
        <div className="uwc-loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="uwc-container">
        <h2 className="uwc-title">Erreur</h2>
        <div className="uwc-error-message">
          <p>{error}</p>
          <button 
            onClick={() => navigate('/signin')}
            className="uwc-action-button"
          >
            Retour à la page de connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="uwc-container">
      <h2 className="uwc-title">Utilisateurs avec Contrats d'Assurance</h2>
      
      <div className="uwc-stats-container">
        <div className="uwc-stat-item">
          <span className="uwc-stat-value">{users.length}</span>
          <span className="uwc-stat-label">Total des utilisateurs</span>
        </div>
        
        {policyCounts.map((policyCount) => (
          <div key={policyCount.type} className="uwc-stat-item">
            <span className="uwc-stat-value">{policyCount.count}</span>
            <span className="uwc-stat-label">{policyCount.type}</span>
          </div>
        ))}
      </div>
      
      <div className="uwc-filter-container">
        <label htmlFor="policyTypeFilter" className="uwc-filter-label">Filtrer par type d'assurance:</label>
        <select 
          id="policyTypeFilter" 
          value={selectedPolicyType} 
          onChange={handlePolicyTypeChange}
          className="uwc-filter-select"
        >
          {policyTypes.map(policy => (
            <option key={policy.value} value={policy.value}>
              {policy.label}
            </option>
          ))}
        </select>
      </div>

      {users.length === 0 ? (
        <div className="uwc-no-results">
          <p>Aucun utilisateur trouvé avec des contrats{selectedPolicyType ? ` de type ${selectedPolicyType}` : ''}.</p>
        </div>
      ) : (
        <div className="uwc-users-grid">
          {users.map(user => (
            <div key={user._id} className="uwc-user-card">
              <div className="uwc-user-info">
                <h3>{user.name}</h3>
                <p><strong>Email:</strong> {user.email}</p>
                {user.phone && <p><strong>Téléphone:</strong> {user.phone}</p>}
              </div>
              
              <div className="uwc-contracts-summary">
                <h4>Contrats ({user.contracts.length})</h4>
                <div className="uwc-contracts-preview">
                  {user.contracts.slice(0, expandedUsers[user._id] ? user.contracts.length : 1).map(contract => (
                    <div key={contract._id} className="uwc-contract-item">
                      <div className="uwc-contract-header">
                        <span className="uwc-policy-icon">{getPolicyTypeIcon(contract.policyType)}</span>
                        <span className="uwc-policy-type">{contract.policyType}</span>
                      </div>
                      <div className="uwc-contract-details">
                        <p><strong>Du:</strong> {formatDate(contract.startDate)}</p>
                        <p><strong>Au:</strong> {formatDate(contract.endDate)}</p>
                        <p><strong>Prime:</strong> {contract.premiumAmount} €</p>
                      </div>
                    </div>
                  ))}
                </div>
                {user.contracts.length > 1 && (
                  <button 
                    className="uwc-expand-button"
                    onClick={() => toggleUserExpand(user._id)}
                  >
                    {expandedUsers[user._id] ? 'Voir moins' : 'Voir plus'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersWithContracts;