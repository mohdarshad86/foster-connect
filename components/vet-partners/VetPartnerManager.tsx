"use client"

import { useState, useEffect, useCallback } from "react"
import { FreeTagInput } from "@/components/ui/FreeTagInput"
import { formatDate } from "@/lib/utils"
import { Search, Plus, Pencil, Trash2, X, Phone, Mail, MapPin } from "lucide-react"

interface VetPartner {
  id:          string
  name:        string
  clinicName:  string
  phone:       string | null
  email:       string | null
  address:     string | null
  specialties: string[]
  notes:       string | null
  createdAt:   string
  addedBy:     { name: string }
}

interface FormState {
  name:        string
  clinicName:  string
  phone:       string
  email:       string
  address:     string
  specialties: string[]
  notes:       string
}

const EMPTY_FORM: FormState = {
  name: "", clinicName: "", phone: "", email: "", address: "", specialties: [], notes: "",
}

export function VetPartnerManager({ initial }: { initial: VetPartner[] }) {
  const [partners,  setPartners]  = useState<VetPartner[]>(initial)
  const [search,    setSearch]    = useState("")
  const [showForm,  setShowForm]  = useState(false)
  const [editId,    setEditId]    = useState<string | null>(null)
  const [form,      setForm]      = useState<FormState>(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Client-side search filter
  const filtered = partners.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.clinicName.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.specialties.some((s) => s.toLowerCase().includes(q))
    )
  })

  function openAdd() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(p: VetPartner) {
    setEditId(p.id)
    setForm({
      name:        p.name,
      clinicName:  p.clinicName,
      phone:       p.phone   ?? "",
      email:       p.email   ?? "",
      address:     p.address ?? "",
      specialties: p.specialties,
      notes:       p.notes   ?? "",
    })
    setFormError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    setFormError(null)
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!form.phone && !form.email) {
      setFormError("At least one of phone or email is required.")
      return
    }

    setSaving(true)
    const url    = editId ? `/api/vet-partners/${editId}` : "/api/vet-partners"
    const method = editId ? "PATCH" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:        form.name,
        clinicName:  form.clinicName,
        phone:       form.phone   || null,
        email:       form.email   || null,
        address:     form.address || null,
        specialties: form.specialties,
        notes:       form.notes   || null,
      }),
    })
    setSaving(false)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setFormError(err.error ?? "Save failed")
      return
    }

    const saved: VetPartner = await res.json()
    if (editId) {
      setPartners((prev) => prev.map((p) => (p.id === editId ? saved : p)))
    } else {
      setPartners((prev) => [saved, ...prev])
    }
    closeForm()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this vet partner? This cannot be undone.")) return
    setDeleting(id)
    await fetch(`/api/vet-partners/${id}`, { method: "DELETE" })
    setPartners((prev) => prev.filter((p) => p.id !== id))
    setDeleting(null)
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelCls = "text-xs font-medium text-slate-500 uppercase tracking-wide"

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clinic or specialty…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Vet Partner
        </button>
      </div>

      {/* Inline Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              {editId ? "Edit Vet Partner" : "Add Vet Partner"}
            </h2>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Contact Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className={inputCls}
                  placeholder="Dr. Jane Smith"
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Clinic Name *</label>
                <input
                  required
                  value={form.clinicName}
                  onChange={(e) => setField("clinicName", e.target.value)}
                  className={inputCls}
                  placeholder="Happy Paws Clinic"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  className={inputCls}
                  placeholder="+1 555-0100"
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className={inputCls}
                  placeholder="vet@clinic.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Address</label>
              <input
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                className={inputCls}
                placeholder="123 Main St, City"
              />
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Specialties</label>
              <FreeTagInput
                tags={form.specialties}
                onChange={(next) => setField("specialties", next)}
                placeholder="Type a specialty and press Enter…"
              />
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>

            {formError && <p className="text-xs text-red-500">{formError}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : editId ? "Save changes" : "Add partner"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Partners list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm">{search ? "No partners match your search." : "No vet partners yet. Add one above."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{p.clinicName}</p>
                  <p className="text-xs text-slate-500">{p.name}</p>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {p.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {p.phone}
                    </span>
                  )}
                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      <Mail className="w-3 h-3" /> {p.email}
                    </a>
                  )}
                  {p.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {p.address}
                    </span>
                  )}
                </div>

                {p.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.specialties.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {p.notes && (
                  <p className="text-xs text-slate-400 italic">{p.notes}</p>
                )}

                <p className="text-xs text-slate-400">
                  Added {formatDate(p.createdAt)} · {p.addedBy.name}
                </p>
              </div>

              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openEdit(p)}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
