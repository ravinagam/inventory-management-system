import { AlertTriangle, ClipboardList, TrendingUp, TrendingDown, Minus, Package } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useInventoryLogs } from '../../hooks/useInventory'
import { useTodayAuditItems } from '../../hooks/useAuditHistory'

function timeAgo(ts) {
  if (!ts) return ''
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function StockBar({ current, min }) {
  if (!min) return null
  const pct = Math.min((current / (min * 2)) * 100, 100)
  const isLow = current < min
  return (
    <div className="h-1.5 rounded-full mt-2" style={{ background: '#f1f5f9' }}>
      <div
        className="h-1.5 rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: isLow
            ? 'linear-gradient(90deg, #f97316, #ef4444)'
            : 'linear-gradient(90deg, #22c55e, #16a34a)',
        }}
      />
    </div>
  )
}

function ActionIcon({ action }) {
  if (action === 'Stock In') return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
      <TrendingUp size={17} color="#16a34a" />
    </div>
  )
  if (action === 'Stock Out') return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fef2f2' }}>
      <TrendingDown size={17} color="#dc2626" />
    </div>
  )
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>
      <Minus size={17} color="#1d4ed8" />
    </div>
  )
}

export default function Dashboard() {
  const { products, loading: productsLoading } = useProducts()
  const { logs, loading: logsLoading } = useInventoryLogs(5)
  const { auditItems } = useTodayAuditItems()

  const lowStock = products.filter((p) => (p.currentStock ?? 0) < (p.minStock ?? 0))
  const totalUnits = products.reduce((s, p) => s + (p.currentStock ?? 0), 0)

  return (
    <div className="p-4 space-y-5 pb-24" style={{ background: '#f1f5f9', minHeight: '100vh' }}>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
          <p className="text-xl font-black" style={{ color: '#1d4ed8' }}>{products.length}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#6b7280' }}>Products</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
          <p className="text-xl font-black" style={{ color: lowStock.length > 0 ? '#dc2626' : '#16a34a' }}>
            {lowStock.length}
          </p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#6b7280' }}>Low Stock</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
          <p className="text-xl font-black" style={{ color: '#16a34a' }}>{totalUnits}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#6b7280' }}>Total Units</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} color="#d97706" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Low Stock Alerts</span>
          </div>
          {lowStock.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {lowStock.length} items
            </span>
          )}
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : lowStock.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#f0fdf4' }}>
              <Package size={22} color="#16a34a" />
            </div>
            <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>All products are well stocked!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lowStock.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm"
                style={{ borderLeft: '4px solid #ef4444' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#111827' }}>
                      {item.displayName || item.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                      Min required: {item.minStock ?? 0} units
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black leading-tight" style={{ color: '#dc2626' }}>
                      {item.currentStock ?? 0}
                    </p>
                    <p className="text-xs font-medium" style={{ color: '#dc2626' }}>units left</p>
                  </div>
                </div>
                <StockBar current={item.currentStock ?? 0} min={item.minStock ?? 0} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Items to Audit Today */}
      {auditItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={15} color="#1d4ed8" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Today's Audit</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
              {auditItems.length} items
            </span>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {auditItems.map((item, i) => (
              <div key={item.productId}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: i < auditItems.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span className="text-sm font-medium" style={{ color: '#374151' }}>{item.productName}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={item.actual !== ''
                    ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
                    : { background: '#f9fafb', color: '#9ca3af', border: '1px solid #e5e7eb' }}>
                  {item.actual !== '' ? 'Done' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} color="#9ca3af" />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Recent Activity</span>
        </div>

        {logsLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
            <p className="text-sm" style={{ color: '#9ca3af' }}>No inventory activity yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden"
            style={{ maxHeight: '280px', overflowY: 'auto', scrollbarWidth: 'none' }}>
            {logs.map((log, i) => {
              const isIn = log.action === 'Stock In'
              const isOut = log.action === 'Stock Out'
              const badgeStyle = isIn
                ? { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }
                : isOut
                ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }
                : { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
              const badgeText = isIn ? `+${log.quantity}` : isOut ? `-${log.quantity}` : `~${log.quantity}`

              return (
                <div key={log.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < logs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <ActionIcon action={log.action} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{log.productName}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                      {log.action}{log.notes ? ` · ${log.notes}` : ''} · {timeAgo(log.createdAt)}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={badgeStyle}>
                    {badgeText}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
