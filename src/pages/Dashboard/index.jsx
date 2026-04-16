import { AlertTriangle, ClipboardList, Activity } from 'lucide-react'
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

export default function Dashboard() {
  const { products, loading: productsLoading } = useProducts()
  const { logs, loading: logsLoading } = useInventoryLogs(5)
  const { auditItems } = useTodayAuditItems()

  const lowStock = products.filter((p) => (p.currentStock ?? 0) < (p.minStock ?? 0))

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Inventory Summary</h1>

      {/* Low Stock Alerts */}
      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-600 font-semibold">
          <AlertTriangle size={18} />
          Low Stock Alerts
          {lowStock.length > 0 && (
            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {lowStock.length}
            </span>
          )}
        </div>
        {productsLoading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : lowStock.length === 0 ? (
          <p className="text-sm text-green-600">All products are well stocked!</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {lowStock.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-800 flex-1 min-w-0 truncate pr-2">
                  {item.displayName || item.name}
                </span>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="text-gray-400">Min: <span className="font-medium text-gray-600">{item.minStock ?? 0}</span></span>
                  <span className="text-red-500 font-semibold">{item.currentStock ?? 0} left</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Items to Audit Today */}
      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
        <div className="flex items-center gap-2 text-blue-600 font-semibold">
          <ClipboardList size={18} />
          Items to Audit Today
          {auditItems.length > 0 && (
            <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {auditItems.length}
            </span>
          )}
        </div>
        {auditItems.length === 0 ? (
          <p className="text-sm text-gray-400">No audits started today. Go to Audit tab.</p>
        ) : (
          auditItems.map((item) => (
            <div key={item.productId} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
              <span className="text-gray-700">{item.productName}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                item.actual !== '' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {item.actual !== '' ? 'Done' : 'Pending'}
              </span>
            </div>
          ))
        )}
      </section>

      {/* Recent Activity */}
      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
        <div className="flex items-center gap-2 text-green-600 font-semibold">
          <Activity size={18} />
          Recent Activity
        </div>
        {logsLoading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-400">No activity yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex justify-between items-center text-sm py-1 border-b last:border-0 gap-2">
              <div>
                <span className={`font-medium ${log.action === 'Stock In' ? 'text-green-600' : log.action === 'Stock Out' ? 'text-red-500' : 'text-blue-600'}`}>
                  {log.action === 'Stock In' ? '+' : log.action === 'Stock Out' ? '-' : '~'}{log.quantity}
                </span>
                <span className="text-gray-700 ml-1">{log.productName}</span>
                {log.notes ? (
                  <span className="text-gray-400 ml-4 italic">{log.notes}</span>
                ) : null}
              </div>
              <span className="text-gray-400 text-xs shrink-0">{timeAgo(log.createdAt)}</span>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
