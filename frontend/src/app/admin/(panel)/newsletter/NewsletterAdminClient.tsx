"use client"

interface Subscriber {
  id: string
  email: string
  subscribed_at: string
  is_active: boolean
}

export default function NewsletterAdminClient({ subscribers }: { subscribers: Subscriber[] }) {
  const active = subscribers.filter((s) => s.is_active)

  function exportCsv() {
    const rows = [
      ["Email", "Subscribed At", "Active"],
      ...active.map((s) => [
        s.email,
        new Date(s.subscribed_at).toLocaleDateString("en-GB"),
        "Yes",
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{subscribers.length} total · {active.length} active</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={active.length === 0}
          className="flex items-center gap-2 px-4 h-10 text-xs uppercase tracking-wider font-semibold text-white rounded-sm transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Stat card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Total Subscribers" value={subscribers.length} />
        <StatCard label="Active" value={active.length} />
        <StatCard label="Unsubscribed" value={subscribers.length - active.length} />
      </div>

      {/* Table */}
      <div className="bg-white border rounded-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        {subscribers.length === 0 ? (
          <p className="py-16 text-center text-gray-400 text-sm">No subscribers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Subscribed</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#f3f4f6" }}>
                {subscribers.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.email}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(s.subscribed_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                        style={
                          s.is_active
                            ? { backgroundColor: "#dcfce7", color: "#16a34a" }
                            : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                        }
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border rounded-sm px-5 py-4" style={{ borderColor: "#e5e7eb" }}>
      <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold" style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}
