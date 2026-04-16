import { useState } from 'react'
import { CheckCircle, ClipboardList, History } from 'lucide-react'
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
    return <p className="text-center text-sm text-gray-400 py-10">No audit history yet.</p>
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div key={session.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Session header */}
          <button
            onClick={() => setExpanded(expanded === session.id ? null : session.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800">{formatDate(session.createdAt)}</p>
              <p className="text-xs text-gray-500">{session.items?.length ?? 0} items</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              session.status === 'completed'
                ? 'bg-green-100 text-green-600'
                : 'bg-amber-100 text-amber-600'
            }`}>
              {session.status === 'completed' ? 'Completed' : 'Pending'}
            </span>
          </button>

          {/* Expanded items */}
          {expanded === session.id && (
            <div className="border-t divide-y">
              {(session.items || []).map((item) => (
                <div key={item.productId} className="px-4 py-3 text-sm space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{item.productName}</span>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>Exp: <span className="font-semibold text-gray-700">{item.expected}</span></span>
                      <span>Act: <span className={`font-semibold ${
                        item.actual === '' ? 'text-gray-400' :
                        Number(item.actual) < item.expected ? 'text-red-500' :
                        Number(item.actual) > item.expected ? 'text-blue-500' : 'text-green-600'
                      }`}>{item.actual !== '' ? item.actual : '—'}</span></span>
                    </div>
                  </div>
                  {item.reason && (
                    <p className="text-xs text-gray-500">
                      Reason: <span className="font-medium text-gray-700">{item.reason}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function DailyAudit() {
  const { products, loading: productsLoading } = useProducts()
  const { auditItems, sessionStatus, updateItem, submitAudit, startNewAudit } = useAudit(products)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState('audit') // 'audit' | 'history'

  async function handleSubmit() {
    const incomplete = auditItems.filter((i) => i.actual === '' || i.actual === null || i.actual === undefined)
    if (incomplete.length > 0) return alert('Please enter actual count for all items')
    setSubmitting(true)
    try {
      await submitAudit()
    } catch (err) {
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
    <div className="p-4 space-y-4">
      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('audit')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'audit' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
          }`}
        >
          <ClipboardList size={15} /> Audit
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'history' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
          }`}
        >
          <History size={15} /> History
        </button>
      </div>

      {/* History tab */}
      {tab === 'history' && <AuditHistory />}

      {/* Audit tab */}
      {tab === 'audit' && (
        <>
          {products.length < 1 ? (
            <p className="text-center text-sm text-gray-500 py-10">Add products first to start auditing.</p>
          ) : sessionStatus === null || sessionStatus === 'completed' ? (
            <div className="flex flex-col items-center justify-center gap-5 text-center py-12">
              {sessionStatus === 'completed' && (
                <>
                  <CheckCircle size={64} className="text-green-500" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Audit Complete!</h2>
                    <p className="text-sm text-gray-500 mt-1">Stock levels have been updated.</p>
                  </div>
                </>
              )}
              {sessionStatus === null && (
                <>
                  <ClipboardList size={64} className="text-blue-400" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Daily Audit</h2>
                    <p className="text-sm text-gray-500 mt-1">Count stock and reconcile discrepancies.</p>
                  </div>
                </>
              )}
              <button
                onClick={startNewAudit}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Start New Audit
              </button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Current Audit</h1>
                <p className="text-sm text-gray-500">Count items and submit</p>
              </div>
              <div className="space-y-3">
                {auditItems.map((item, index) => (
                  <div key={item.productId} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-800">{item.productName}</h3>
                        {item.sku && (
                          <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{item.sku}</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-gray-500 text-xs">Expected</p>
                        <p className="font-semibold text-gray-800">{item.expected}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-gray-500 text-xs">Actual Count</p>
                        <input
                          type="number" min="0"
                          value={item.actual}
                          onChange={(e) => updateItem(item.productId, 'actual', e.target.value)}
                          placeholder="Enter count"
                          className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Reason</label>
                      <select
                        value={item.reason}
                        onChange={(e) => updateItem(item.productId, 'reason', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select reason...</option>
                        {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Audit'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
