import { useState } from 'react'
import { CheckCircle, ClipboardList, History, ChevronDown, ChevronUp } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useAudit } from '../../hooks/useAudit'
import { useAuditHistory } from '../../hooks/useAuditHistory'

const REASONS = ['Damage', 'Theft', 'Recount', 'Supplier Error', 'Other']

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate()
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function AuditHistory() {
  const { sessions, loading } = useAuditHistory()
  const [expanded, setExpanded] = useState(null)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16">
        <History size={44} color="#d1d5db" className="mx-auto mb-3" />
        <p className="text-sm" style={{ color: '#9ca3af' }}>No audit history yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const isOpen = expanded === session.id
        const isDone = session.status === 'completed'
        return (
          <div key={session.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : session.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <div>
                <p className="text-sm font-bold" style={{ color: '#111827' }}>{formatDate(session.createdAt)}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{session.items?.length ?? 0} items audited</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={isDone
                    ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
                    : { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                  {isDone ? 'Completed' : 'Pending'}
                </span>
                {isOpen ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
              </div>
            </button>

            {isOpen && (
              <div style={{ borderTop: '1px solid #f1f5f9' }}>
                {(session.items || []).map((item, i) => {
                  const diff = item.actual !== '' ? Number(item.actual) - item.expected : null
                  const diffColor = diff === null ? '#9ca3af' : diff < 0 ? '#dc2626' : diff > 0 ? '#1d4ed8' : '#16a34a'
                  return (
                    <div key={item.productId} className="px-4 py-3 space-y-1.5"
                      style={{ borderBottom: i < session.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{item.productName}</p>
                        {diff !== null && diff !== 0 && (
                          <span className="text-xs font-bold flex-shrink-0"
                            style={{ color: diffColor }}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs" style={{ color: '#9ca3af' }}>Expected</span>
                          <span className="text-sm font-bold" style={{ color: '#374151' }}>{item.expected}</span>
                        </div>
                        <span style={{ color: '#d1d5db' }}>→</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs" style={{ color: '#9ca3af' }}>Actual</span>
                          <span className="text-sm font-bold" style={{ color: diffColor }}>
                            {item.actual !== '' ? item.actual : '—'}
                          </span>
                        </div>
                      </div>
                      {item.reason && (
                        <p className="text-xs" style={{ color: '#6b7280' }}>
                          Reason: <span className="font-semibold" style={{ color: '#374151' }}>{item.reason}</span>
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function DailyAudit() {
  const { products, loading: productsLoading } = useProducts()
  const { auditItems, sessionStatus, updateItem, submitAudit, startNewAudit } = useAudit(products)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState('audit')

  async function handleSubmit() {
    const incomplete = auditItems.filter((i) => i.actual === '' || i.actual === null || i.actual === undefined)
    if (incomplete.length > 0) return alert('Please enter actual count for all items')
    setSubmitting(true)
    try {
      await submitAudit()
    } catch {
      alert('Failed to submit audit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (productsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-24" style={{ background: '#f1f5f9', minHeight: '100vh' }}>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: '#e2e8f0' }}>
        <button
          onClick={() => setTab('audit')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={tab === 'audit'
            ? { background: '#fff', color: '#111827', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
            : { color: '#9ca3af' }}
        >
          <ClipboardList size={15} /> Audit
        </button>
        <button
          onClick={() => setTab('history')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={tab === 'history'
            ? { background: '#fff', color: '#111827', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
            : { color: '#9ca3af' }}
        >
          <History size={15} /> History
        </button>
      </div>

      {tab === 'history' && <AuditHistory />}

      {tab === 'audit' && (
        <>
          {products.length < 1 ? (
            <div className="text-center py-16">
              <ClipboardList size={44} color="#d1d5db" className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: '#9ca3af' }}>Add products first to start auditing.</p>
            </div>
          ) : sessionStatus === null || sessionStatus === 'completed' ? (
            <div className="flex flex-col items-center justify-center gap-5 text-center py-16">
              {sessionStatus === 'completed' ? (
                <>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: '#f0fdf4' }}>
                    <CheckCircle size={44} color="#16a34a" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black" style={{ color: '#111827' }}>Audit Complete!</h2>
                    <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>Stock levels have been updated.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: '#eff6ff' }}>
                    <ClipboardList size={44} color="#1d4ed8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black" style={{ color: '#111827' }}>Daily Audit</h2>
                    <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>Count stock and reconcile discrepancies.</p>
                  </div>
                </>
              )}
              <button
                onClick={startNewAudit}
                className="px-10 py-3.5 rounded-2xl text-white font-black text-sm"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 14px rgba(29,78,216,0.35)' }}
              >
                Start New Audit
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-black" style={{ color: '#111827' }}>Current Audit</h1>
                  <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{auditItems.length} items to count</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                  In Progress
                </span>
              </div>

              <div className="space-y-3">
                {auditItems.map((item, index) => {
                  const diff = item.actual !== '' ? Number(item.actual) - item.expected : null
                  const diffColor = diff === null ? null : diff < 0 ? '#dc2626' : diff > 0 ? '#1d4ed8' : '#16a34a'
                  return (
                    <div key={item.productId} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold truncate" style={{ color: '#111827' }}>{item.productName}</h3>
                          {item.sku && (
                            <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                              style={{ background: '#eff6ff', color: '#1d4ed8' }}>{item.sku}</span>
                          )}
                        </div>
                        {diff !== null && (
                          <span className="text-sm font-black" style={{ color: diffColor }}>
                            {diff === 0 ? '✓' : diff > 0 ? `+${diff}` : diff}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: '#f8fafc' }}>
                          <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>Expected</p>
                          <p className="text-lg font-black mt-0.5" style={{ color: '#374151' }}>{item.expected}</p>
                        </div>
                        <div className="rounded-xl px-3 py-2.5" style={{ background: '#f8fafc' }}>
                          <p className="text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>Actual Count</p>
                          <input
                            type="number"
                            min="0"
                            value={item.actual}
                            onChange={(e) => updateItem(item.productId, 'actual', e.target.value)}
                            placeholder="Enter count"
                            className="w-full text-center text-lg font-black bg-transparent border-b-2 focus:outline-none"
                            style={{ borderColor: diff !== null ? diffColor || '#e5e7eb' : '#e5e7eb', color: diffColor || '#111827' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium" style={{ color: '#9ca3af' }}>Reason for discrepancy</label>
                        <select
                          value={item.reason}
                          onChange={(e) => updateItem(item.productId, 'reason', e.target.value)}
                          className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#374151' }}
                        >
                          <option value="">Select reason (optional)…</option>
                          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 rounded-2xl text-white font-black text-sm disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}
              >
                {submitting ? 'Submitting…' : 'Submit Audit'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
