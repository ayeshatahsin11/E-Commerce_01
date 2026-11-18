"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2, X } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { Spinner } from "@/components/ui/Loading";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";

const UNITS = [
  ["kg", "Kilogram (kg)"],
  ["g", "Gram (g)"],
  ["piece", "Piece"],
  ["dozen", "Dozen"],
  ["bunch", "Bunch"],
  ["litre", "Litre"],
];

// Good starting values when the unit is picked (minimum order and step)
const UNIT_DEFAULTS = {
  kg: ["0.5", "0.5"],
  g: ["250", "50"],
  piece: ["1", "1"],
  dozen: ["1", "1"],
  bunch: ["1", "1"],
  litre: ["1", "0.5"],
};

const FRESHNESS = [
  ["none", "Not specified"],
  ["fresh_today", "Fresh today"],
  ["seasonal", "Seasonal"],
];

const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024;

const blankForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  discountPrice: "",
  unit: "kg",
  minOrderQty: "0.5",
  step: "0.5",
  stock: "",
  origin: "",
  freshness: "none",
  isOrganic: false,
  isFeatured: false,
  isActive: true,
};

const fromProduct = (product) => ({
  name: product.name,
  description: product.description,
  category: product.category?._id || product.category || "",
  price: String(product.price),
  discountPrice: product.discountPrice != null ? String(product.discountPrice) : "",
  unit: product.unit || "kg",
  minOrderQty: String(product.minOrderQty ?? 1),
  step: String(product.step ?? 1),
  stock: String(product.stock),
  origin: product.origin || "",
  freshness: product.freshness || "none",
  isOrganic: Boolean(product.isOrganic),
  isFeatured: Boolean(product.isFeatured),
  isActive: product.isActive !== false,
});

// Used for both "Add product" (no product prop) and "Edit product"
export default function ProductForm({ product }) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const editing = Boolean(product);

  const categories = useApi("/categories");
  const categoryList = categories.data?.categories || [];

  const [form, setForm] = useState(product ? fromProduct(product) : blankForm);
  const [savedImages, setSavedImages] = useState(product?.images || []);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  // temporary preview links for the picked files (removed again when they change)
  const previews = useMemo(() => newFiles.map((file) => URL.createObjectURL(file)), [newFiles]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const changeUnit = (event) => {
    const unit = event.target.value;
    setForm((f) => {
      if (editing) return { ...f, unit };
      const [minOrderQty, step] = UNIT_DEFAULTS[unit];
      return { ...f, unit, minOrderQty, step };
    });
  };

  const pickFiles = (event) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = ""; // so the same file can be picked again later

    const room = MAX_IMAGES - savedImages.length - newFiles.length;
    if (room <= 0) {
      toast.error(`A product can have at most ${MAX_IMAGES} images`);
      return;
    }

    const valid = picked.filter((file) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG or WEBP images are allowed`);
        return false;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name}: image must be 5MB or smaller`);
        return false;
      }
      return true;
    });

    if (valid.length > room) toast.info(`Only ${room} more image(s) fit, extra files were skipped`);
    setNewFiles((files) => [...files, ...valid.slice(0, room)]);
  };

  const removeSavedImage = async (image) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      const data = await api.delete(`/products/${product._id}/images/${image._id}`);
      setSavedImages(data.product.images);
      toast.success("Image deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const validate = () => {
    const price = Number(form.price);
    if (!form.name.trim()) return "Product name is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.category) return "Please choose a category";
    if (!(price > 0)) return "Price must be greater than 0";
    if (form.discountPrice !== "" && !(Number(form.discountPrice) >= 0 && Number(form.discountPrice) < price)) {
      return "Discount price must be lower than the price";
    }
    if (!(Number(form.minOrderQty) > 0)) return "Minimum order must be greater than 0";
    if (!(Number(form.step) > 0)) return "Step must be greater than 0";
    if (form.stock === "" || Number(form.stock) < 0) return "Stock must be 0 or more";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price),
      discountPrice: form.discountPrice === "" ? (editing ? null : undefined) : Number(form.discountPrice),
      unit: form.unit,
      minOrderQty: Number(form.minOrderQty),
      step: Number(form.step),
      stock: Number(form.stock),
      origin: form.origin.trim(),
      freshness: form.freshness,
      isOrganic: form.isOrganic,
      isActive: form.isActive,
    };
    if (isAdmin) payload.isFeatured = form.isFeatured; // only admins can feature products

    setSaving(true);
    let productId = product?._id;

    try {
      const data = editing ? await api.put(`/products/${productId}`, payload) : await api.post("/products", payload);
      productId = data.product._id;
    } catch (err) {
      toast.error(err.message);
      setSaving(false);
      return;
    }

    // images are uploaded in a second step
    if (newFiles.length > 0) {
      try {
        const body = new FormData();
        newFiles.forEach((file) => body.append("images", file));
        await api.post(`/products/${productId}/images`, body);
      } catch (err) {
        toast.error(`Product saved, but the images could not be uploaded: ${err.message}`);
        router.push(`/dashboard/products/${productId}/edit`);
        return;
      }
    }

    toast.success(editing ? "Product updated" : "Product added");
    router.push("/dashboard/products");
  };

  const imageCount = savedImages.length + newFiles.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* basic info */}
      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Basic information</h2>

        <div>
          <label htmlFor="name" className="label">Product name</label>
          <input id="name" name="name" required maxLength={120} value={form.name} onChange={update} placeholder="e.g. Fresh Red Tomato" className="input" />
        </div>

        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea id="description" name="description" required maxLength={2000} rows={4} value={form.description} onChange={update} placeholder="Tell customers about this product" className="input" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="label">Category</label>
            <select id="category" name="category" required value={form.category} onChange={update} className="input">
              <option value="">Choose a category</option>
              {categoryList.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
            {!categories.loading && categoryList.length === 0 && (
              <p className="mt-1.5 text-xs text-red-600">
                No categories yet.{" "}
                {isAdmin ? (
                  <Link href="/dashboard/categories" className="font-semibold underline">Add one first</Link>
                ) : (
                  "Ask the admin to add categories."
                )}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="origin" className="label">Origin / farm (optional)</label>
            <input id="origin" name="origin" maxLength={80} value={form.origin} onChange={update} placeholder="e.g. Jessore" className="input" />
          </div>
        </div>
      </section>

      {/* pricing + selling unit */}
      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Price and stock</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="unit" className="label">Sold by</label>
            <select id="unit" name="unit" value={form.unit} onChange={changeUnit} className="input">
              {UNITS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="stock" className="label">Stock (in {form.unit})</label>
            <input id="stock" name="stock" type="number" min="0" step="any" required value={form.stock} onChange={update} placeholder="e.g. 25.5" className="input" />
          </div>
          <div>
            <label htmlFor="price" className="label">Price per {form.unit} (৳)</label>
            <input id="price" name="price" type="number" min="0" step="any" required value={form.price} onChange={update} className="input" />
          </div>
          <div>
            <label htmlFor="discountPrice" className="label">Discount price per {form.unit} (optional)</label>
            <input id="discountPrice" name="discountPrice" type="number" min="0" step="any" value={form.discountPrice} onChange={update} placeholder="Leave empty for no discount" className="input" />
          </div>
          <div>
            <label htmlFor="minOrderQty" className="label">Minimum order ({form.unit})</label>
            <input id="minOrderQty" name="minOrderQty" type="number" min="0" step="any" required value={form.minOrderQty} onChange={update} className="input" />
          </div>
          <div>
            <label htmlFor="step" className="label">Quantity step ({form.unit})</label>
            <input id="step" name="step" type="number" min="0" step="any" required value={form.step} onChange={update} className="input" />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Example: with minimum 0.5 and step 0.5, customers can buy 0.5, 1, 1.5 {form.unit}... The minimum must be a
          multiple of the step.
        </p>
      </section>

      {/* tags */}
      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Labels and visibility</h2>

        <div className="max-w-xs">
          <label htmlFor="freshness" className="label">Freshness tag</label>
          <select id="freshness" name="freshness" value={form.freshness} onChange={update} className="input">
            {FRESHNESS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" name="isOrganic" checked={form.isOrganic} onChange={update} className="h-4 w-4 accent-leaf-600" />
            Organic
          </label>
          {isAdmin && (
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={update} className="h-4 w-4 accent-leaf-600" />
              Featured on home page
            </label>
          )}
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={update} className="h-4 w-4 accent-leaf-600" />
            Visible in the store
          </label>
        </div>
      </section>

      {/* images */}
      <section className="card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Photos</h2>
          <span className="text-sm text-gray-500">{imageCount} / {MAX_IMAGES}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {savedImages.map((image) => (
            <div key={image._id} className="group relative aspect-square overflow-hidden rounded-xl bg-leaf-50">
              <SmartImage src={image.url} alt="Product" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeSavedImage(image)}
                aria-label="Delete image"
                className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1.5 text-red-500 shadow hover:bg-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {newFiles.map((file, n) => (
            <div key={`${file.name}-${n}`} className="relative aspect-square overflow-hidden rounded-xl bg-leaf-50 ring-2 ring-leaf-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[n]} alt={file.name} className="h-full w-full object-cover" />
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-leaf-600 px-2 py-0.5 text-[10px] font-bold text-white">New</span>
              <button
                type="button"
                onClick={() => setNewFiles((files) => files.filter((_, i) => i !== n))}
                aria-label="Remove image"
                className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1.5 text-gray-600 shadow hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {imageCount < MAX_IMAGES && (
            <label
              htmlFor="product-images"
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-leaf-200 text-xs text-gray-500 hover:border-leaf-400 hover:bg-leaf-50"
            >
              <ImagePlus className="h-6 w-6 text-leaf-500" />
              Add photos
            </label>
          )}
        </div>
        <input id="product-images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pickFiles} className="sr-only" />
        <p className="text-xs text-gray-500">JPG, PNG or WEBP, up to 5MB each. The first photo is the main one.</p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="btn btn-primary px-8">
          {saving ? <Spinner className="h-4 w-4" /> : editing ? "Save changes" : "Add product"}
        </button>
        <Link href="/dashboard/products" className="btn btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}