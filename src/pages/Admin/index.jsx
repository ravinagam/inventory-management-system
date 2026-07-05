import { useState } from 'react'
import { ArrowLeft, Building2, Users, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAdminStats from '../../hooks/useAdminStats'
import useAdminCompanies from '../../hooks/useAdminCompanies'
import useAdminUsers from '../../hooks/useAdminUsers'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
      <div style={{ background: color, padding: '10px', borderRadius: '8px' }}>
        <Icon size={24} color="#fff" />
      </div>
      <div>
        <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
        <p style={{ fontSize: '28px', fontWeight: 900, color: '#111827' }}>{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { stats, loading: statsLoading } = useAdminStats()
  const { companies } = useAdminCompanies()
  const { users } = useAdminUsers()
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '20px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} color="#374151" />
        </button>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: 0 }}>Admin Dashboard</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Platform overview & management</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="#3b82f6" />
        <StatCard icon={Building2} label="Total Companies" value={stats?.totalCompanies} color="#10b981" />
        <StatCard icon={BarChart3} label="Free Plans" value={stats?.freePlan} color="#f59e0b" />
        <StatCard icon={BarChart3} label="Paid Plans" value={(stats?.starterPlan || 0) + (stats?.proPlan || 0)} color="#8b5cf6" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm" style={{ width: 'fit-content' }}>
        {['overview', 'companies', 'users'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab ? '#1d4ed8' : 'transparent',
              color: activeTab === tab ? '#fff' : '#6b7280',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>Platform Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>User Statistics</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, gap: '8px', display: 'flex', flexDirection: 'column' }}>
                  <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280' }}>Total Registered Users</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{stats?.totalUsers ?? '—'}</span>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ color: '#6b7280' }}>Average Users per Company</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>
                      {stats?.totalCompanies && stats?.totalUsers ? (stats.totalUsers / stats.totalCompanies).toFixed(1) : '—'}
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Plan Breakdown</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, gap: '8px', display: 'flex', flexDirection: 'column' }}>
                  <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280' }}>Free Tier</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{stats?.freePlan ?? '—'}</span>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280' }}>Starter Plan</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{stats?.starterPlan ?? '—'}</span>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ color: '#6b7280' }}>Pro Plan</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{stats?.proPlan ?? '—'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Company</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Owner</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Users</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Products</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Stock</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Plan</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company, i) => (
                  <tr key={company.id} style={{ borderBottom: i < companies.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} onClick={() => navigate(`/admin/company/${company.id}`)}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>{company.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{company.owner}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', color: '#111827', fontWeight: 600 }}>{company.users}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', color: '#111827', fontWeight: 600 }}>{company.products}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', color: '#111827', fontWeight: 600 }}>{company.totalStock}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: company.plan === 'pro' ? '#8b5cf6' : company.plan === 'starter' ? '#3b82f6' : '#f59e0b', textTransform: 'uppercase' }}>{company.plan}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: company.status === 'active' ? '#10b981' : '#dc2626', textTransform: 'capitalize' }}>{company.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {companies.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                No companies found
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Username</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Display Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Registered</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.uid} style={{ borderBottom: i < users.length - 1 ? '1px solid #f1f5f9' : 'none' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>@{user.username}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{user.email}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>{user.displayName}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: user.role === 'owner' ? '#8b5cf6' : '#3b82f6', textTransform: 'capitalize' }}>{user.role}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                      {user.createdAt ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                No users found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
