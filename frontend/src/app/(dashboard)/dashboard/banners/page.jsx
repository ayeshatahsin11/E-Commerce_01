"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EyeOff, ImagePlus, Pencil, Trash2, X } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SmartImage from "@/components/ui/SmartImage";
import { Skeleton, Spinner } from "@/components/ui/Loading";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";

const EMPTY_FORM = { title: "", subtitle: "", buttonText: "Shop now", link: "/shop", sortOrder: "0", isActive: true };
const MAX_SIZE = 5 * 1024 * 1024;

function BannersContent() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/banners/all");
  const banners = data?.banners || [];

  const fileInput = useRef(null);
  const [editing, setEditing] = useState(null); // the banner being edited, or null when adding
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // temporary preview link of the picked file (removed again when it changes)
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const pickFile = (event) => {
    const picked = event.target.files?.[0];
    if (!picked) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(picked.type)) {
      toast.error("Only JPG, PNG or WEBP images are allowed");
      return;
    }
    if (picked.size > MAX_SIZE) {
      toast.error("The image must be 5MB or smaller");
      return;
    }
    setFile(picked);
  };

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const startEdit = (banner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      buttonText: banner.buttonText || "Shop now",
      link: banner.link || "/shop",
      sortOrder: String(banner.sortOrder ?? 0),
      isActive: banner.isActive,
    });
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!editing && !file) {
      toast.error("Please choose a banner image");
      return;
    }

    const body = new FormData();
    body.append("title", form.title.trim());
    body.append("subtitle", form.subtitle.trim());
    body.append("buttonText", form.buttonText.trim());
    body.append("link", form.link.trim());
    body.append("sortOrder", form.sortOrder);
    body.append("isActive", String(form.isActive));
    if (file) body.append("image", file);

    setSaving(true);
    try {
      if (editing) await api.put(`/banners/${editing._id}`, body);
      else await api.post("/banners", body);
      toast.success(editing ? "Banner updated" : "Banner added");
      resetForm();
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (banner) => {
    if (!window.confirm(`Delete the banner "${banner.title}"?`)) return;
    try {
      await api.delete(`/banners/${banner._id}`);
      toast.success("Banner deleted");
      if (editing?._id === banner._id) resetForm();
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const shownImage = preview || editing?.image?.url;

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Home banners</h1>
      <p className="mt-1 text-gray-500">These slide at the top of the home page, smallest order number first.</p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{editing ? "Edit banner" : "Add a new banner"}</h2>
          {editing && (
            <button type="button" onClick={resetForm} className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-ink">
              <X className="h-4 w-4" /> Cancel edit
            </button>
          )}
        </div>

        <div>
          <label className="label">Banner image {editing ? "(leave empty to keep the current one)" : ""}</label>
          <label
            htmlFor="banner-image"
            className="flex aspect-[21/8] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-leaf-200 bg-leaf-50 hover:border-leaf-400"
          >
            {shownImage ? (
              <SmartImage src={shownImage} alt="Banner preview" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm text-gray-500">
                <ImagePlus className="h-8 w-8 text-leaf-500" />
                Click to choose an image
                <span className="text-xs">Best size 1920 x 720 px, JPG / PNG / WEBP, max 5MB</span>
              </span>
            )}
          </label>
          <input id="banner-image" ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} className="sr-only" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="b-title" className="label">Title</label>
            <input id="b-title" name="title" required maxLength={80} value={form.title} onChange={update} placeholder="Fresh vegetables, 20% off" className="input" />
          </div>
          <div>
            <label htmlFor="b-sub" className="label">Subtitle (optional)</label>
            <input id="b-sub" name="subtitle" maxLength={200} value={form.subtitle} onChange={update} placeholder="Picked this morning from local farms" className="input" />
          </div>
          <div>
            <label htmlFor="b-btn" className="label">Button text</label>
            <input id="b-btn" name="buttonText" maxLength={30} value={form.buttonText} onChange={update} className="input" />
          </div>
          <div>
            <label htmlFor="b-link" className="label">Button link</label>
            <input id="b-link" name="link" value={form.link} onChange={update} placeholder="/shop?organic=true" className="input" />
          </div>
          <div>
            <label htmlFor="b-order" className="label">Order (smaller shows first)</label>
            <input id="b-order" name="sortOrder" type="number" value={form.sortOrder} onChange={update} className="input" />
          </div>
          <label className="flex cursor-pointer items-center gap-3 self-end pb-3 text-sm">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={update} className="h-4 w-4 accent-leaf-600" />
            Show this banner on the home page
          </label>
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? <Spinner className="h-4 w-4" /> : editing ? "Save changes" : "Add banner"}
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          [1, 2].map((n) => <Skeleton key={n} className="h-28" />)
        ) : banners.length === 0 ? (
          <p className="card p-8 text-center text-gray-500">
            No banners yet. Until you add one, the home page shows a default green banner.
          </p>
        ) : (
          banners.map((banner) => (
            <div key={banner._id} className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
              <div className="aspect-[21/8] w-full shrink-0 overflow-hidden rounded-xl bg-leaf-50 sm:w-56">
                <SmartImage src={banner.image?.url} alt={banner.title} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{banner.title}</p>
                <p className="truncate text-sm text-gray-500">{banner.subtitle || "No subtitle"}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Order {banner.sortOrder} · Links to {banner.link || "/shop"}
                </p>
                {!banner.isActive && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                    <EyeOff className="h-3 w-3" /> Hidden
                  </span>
                )}
              </div>
              <div className="flex gap-1 sm:flex-col">
                <button type="button" onClick={() => startEdit(banner)} aria-label={`Edit ${banner.title}`} className="rounded-full p-2.5 text-gray-500 hover:bg-leaf-50 hover:text-leaf-700">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove(banner)} aria-label={`Delete ${banner.title}`} className="rounded-full p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function BannersPage() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <BannersContent />
    </ProtectedRoute>
  );
}