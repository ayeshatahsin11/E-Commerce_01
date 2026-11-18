"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Skeleton, Spinner } from "@/components/ui/Loading";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { categoryEmoji } from "@/lib/format";
import { useApi } from "@/lib/useApi";

function CategoriesContent() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/categories");
  const categories = data?.categories || [];

  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const addCategory = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/categories", { name: form.name.trim(), description: form.description.trim() });
      toast.success("Category added");
      setForm({ name: "", description: "" });
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setEditForm({ name: category.name, description: category.description || "" });
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/categories/${id}`, { name: editForm.name.trim(), description: editForm.description.trim() });
      toast.success("Category updated");
      setEditingId(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (category) => {
    if (!window.confirm(`Delete the category "${category.name}"?`)) return;
    try {
      await api.delete(`/categories/${category._id}`);
      toast.success("Category deleted");
      reload();
    } catch (err) {
      toast.error(err.message); // e.g. "category is used by products"
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Categories</h1>
      <p className="mt-1 text-gray-500">Customers use these to browse the shop.</p>

      <form onSubmit={addCategory} className="card mt-6 grid gap-3 p-5 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
        <div>
          <label htmlFor="cat-name" className="label">Name</label>
          <input
            id="cat-name"
            required
            maxLength={60}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Leafy Greens"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="cat-desc" className="label">Description (optional)</label>
          <input
            id="cat-desc"
            maxLength={300}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short line about this category"
            className="input"
          />
        </div>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? <Spinner className="h-4 w-4" /> : <><Plus className="h-4 w-4" /> Add</>}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          [1, 2, 3].map((n) => <Skeleton key={n} className="h-16" />)
        ) : categories.length === 0 ? (
          <p className="card p-8 text-center text-gray-500">No categories yet. Add your first one above.</p>
        ) : (
          categories.map((category) => (
            <div key={category._id} className="card flex flex-wrap items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-2xl">
                {categoryEmoji(category.name)}
              </span>

              {editingId === category._id ? (
                <>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    aria-label="Category name"
                    className="input min-w-40 flex-1"
                  />
                  <input
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    aria-label="Category description"
                    placeholder="Description"
                    className="input min-w-40 flex-[2]"
                  />
                  <button type="button" onClick={() => saveEdit(category._id)} aria-label="Save" className="rounded-full bg-leaf-600 p-2.5 text-white hover:bg-leaf-700">
                    <Check className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} aria-label="Cancel" className="rounded-full p-2.5 text-gray-500 hover:bg-gray-100">
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{category.name}</p>
                    <p className="truncate text-sm text-gray-500">{category.description || "No description"}</p>
                  </div>
                  <button type="button" onClick={() => startEdit(category)} aria-label={`Edit ${category.name}`} className="rounded-full p-2.5 text-gray-500 hover:bg-leaf-50 hover:text-leaf-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(category)} aria-label={`Delete ${category.name}`} className="rounded-full p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <CategoriesContent />
    </ProtectedRoute>
  );
}