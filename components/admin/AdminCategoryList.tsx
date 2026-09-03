"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  DraftCategoryTree,
  SavedCategoryTree,
  type DraftCategoryNode,
} from "@/components/admin/CategoryTreeEditor";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminApiError, getAdminErrorMessage } from "@/lib/adminApi";
import {
  createAdminApiCategory,
  deleteAdminApiCategory,
  listAdminApiCategories,
  setAdminApiCategoryActive,
  updateAdminApiCategory,
} from "@/lib/adminCategories";
import { CATEGORY_SLUGS } from "@/lib/category-pages";
import { isReservedCategorySlug } from "@/lib/catalog";
import { toSlug } from "@/lib/utils";
import type { CategoryDto } from "@/types/api";

function isBlockedAdminSlug(slug: string): boolean {
  if ((CATEGORY_SLUGS as readonly string[]).includes(slug)) {
    return false;
  }
  return isReservedCategorySlug(slug);
}

async function createDraftTree(
  node: DraftCategoryNode,
  parentId: string,
): Promise<void> {
  const created = await createAdminApiCategory({
    name: node.name,
    slug: toSlug(node.name) || "kategori",
    description: "",
    isActive: true,
    parentId,
  });
  for (const child of node.children) {
    await createDraftTree(child, created.id);
  }
}

export function AdminCategoryList() {
  const [creating, setCreating] = useState(false);
  const [rows, setRows] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);
  const [visibilityTarget, setVisibilityTarget] = useState<CategoryDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await listAdminApiCategories());
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const replaceRow = (updated: CategoryDto) => {
    setRows((current) =>
      [...current.filter((row) => row.id !== updated.id), updated].sort((a, b) =>
        a.name.localeCompare(b.name, "tr"),
      ),
    );
  };

  const confirmVisibility = async () => {
    if (!visibilityTarget) {
      return;
    }

    const publish = !visibilityTarget.isActive;
    setPendingId(visibilityTarget.id);
    setError("");
    setNotice("");
    try {
      const updated = await setAdminApiCategoryActive(visibilityTarget.id, publish);
      replaceRow(updated);
      setNotice(updated.isActive ? "Kategori yayınlandı." : "Kategori gizlendi.");
      setVisibilityTarget(null);
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setPendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setPendingId(deleteTarget.id);
    setError("");
    setNotice("");
    try {
      await deleteAdminApiCategory(deleteTarget.id);
      await load();
      setNotice(`"${deleteTarget.name}" silindi.`);
      setDeleteTarget(null);
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setPendingId(null);
    }
  };

  const parents = rows.filter((row) => !row.parentId);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-12 tracking-label text-taupe">Taxonomy</p>
          <h1 className="mt-3 font-heading text-32 text-black">Kategoriler</h1>
          <p className="mt-3 max-w-2xl text-14 text-taupe">
            Alt kategori eklemek için kutuya yazıp Ekle’ye basın. Bir alt
            kategorinin üzerindeki + ile onun altına da kategori açabilirsiniz.
            Silme işlemi kategoriyi veritabanından kaldırır.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((current) => !current)}
          className="inline-flex h-12 items-center justify-center bg-charcoal px-6 text-12 tracking-nav text-ivory hover:bg-black"
        >
          {creating ? "Kapat" : "+ Yeni Kategori"}
        </button>
      </div>

      {creating ? (
        <div className="mt-8 border border-border bg-off-white p-6">
          <NewCategoryForm
            existingSlugs={parents.map((row) => row.slug)}
            onCancel={() => setCreating(false)}
            onCreated={async () => {
              await load();
              setCreating(false);
              setNotice("Kategori oluşturuldu.");
              setError("");
            }}
          />
        </div>
      ) : null}

      {notice ? <p className="mt-6 text-14 text-charcoal">{notice}</p> : null}
      {error && !loading ? <p className="mt-6 text-14 text-accent">{error}</p> : null}

      {loading ? (
        <p className="mt-10 text-12 tracking-label text-taupe">Yükleniyor</p>
      ) : error && rows.length === 0 ? (
        <div className="mt-10">
          <ErrorState message={error} onRetry={() => void load()} />
        </div>
      ) : parents.length === 0 ? (
        <div className="mt-10 border border-border bg-off-white p-8">
          <p className="font-heading text-24 text-black">Henüz kategori yok</p>
          <p className="mt-3 max-w-xl text-14 text-taupe">
            Veritabanında kategori kaydı bulunamadı. Sitede gördüğünüz menü
            yalnızca burada eklediğiniz kategorilerden oluşur. &quot;+ Yeni
            Kategori&quot; ile ekleyin.
          </p>
          <p className="mt-4 text-14 text-charcoal">Toplam: 0</p>
        </div>
      ) : (
        <>
          <p className="mt-8 text-12 tracking-label text-taupe">
            Toplam: {parents.length}
          </p>
          <ul className="mt-4 flex flex-col gap-6">
            {parents.map((row) => (
              <li key={row.id} className="border border-border bg-off-white p-6">
                <CategoryEditor
                  row={row}
                  disabled={pendingId === row.id}
                  onSaved={(updated) => {
                    replaceRow(updated);
                    setNotice("Kategori kaydedildi.");
                  }}
                  onTreeChanged={async () => {
                    await load();
                    setNotice("Kategori ağacı güncellendi.");
                  }}
                  onToggle={() => setVisibilityTarget(row)}
                  onDelete={() => setDeleteTarget(row)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {visibilityTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="visibility-category-title"
        >
          <div className="w-full max-w-md border border-border bg-ivory p-6 shadow-lg">
            <h2 id="visibility-category-title" className="font-heading text-24 text-black">
              {visibilityTarget.isActive ? "Kategoriyi gizle" : "Kategoriyi yayınla"}
            </h2>
            <p className="mt-4 text-14 text-charcoal">
              <span className="font-medium">{visibilityTarget.name}</span> kategorisini{" "}
              {visibilityTarget.isActive
                ? "gizlemek istediğinizden emin misiniz? Gizli kategori sitede görünmez."
                : "yayınlamak istediğinizden emin misiniz?"}
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={pendingId === visibilityTarget.id}
                onClick={() => setVisibilityTarget(null)}
                className="inline-flex h-11 items-center border border-charcoal px-6 text-12 tracking-nav text-charcoal disabled:opacity-50"
              >
                Hayır
              </button>
              <button
                type="button"
                disabled={pendingId === visibilityTarget.id}
                onClick={() => void confirmVisibility()}
                className="inline-flex h-11 items-center bg-charcoal px-6 text-12 tracking-nav text-ivory hover:bg-black disabled:opacity-50"
              >
                {pendingId === visibilityTarget.id
                  ? visibilityTarget.isActive
                    ? "Gizleniyor…"
                    : "Yayınlanıyor…"
                  : visibilityTarget.isActive
                    ? "Evet, gizle"
                    : "Evet, yayınla"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
        >
          <div className="w-full max-w-md border border-border bg-ivory p-6 shadow-lg">
            <h2 id="delete-category-title" className="font-heading text-24 text-black">
              Kategoriyi sil
            </h2>
            <p className="mt-4 text-14 text-charcoal">
              <span className="font-medium">{deleteTarget.name}</span> kategorisini silmek
              istediğinizden emin misiniz? Alt kategoriler de silinir. Bu işlem geri
              alınamaz.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={pendingId === deleteTarget.id}
                onClick={() => setDeleteTarget(null)}
                className="inline-flex h-11 items-center border border-charcoal px-6 text-12 tracking-nav text-charcoal disabled:opacity-50"
              >
                Hayır
              </button>
              <button
                type="button"
                disabled={pendingId === deleteTarget.id}
                onClick={() => void confirmDelete()}
                className="inline-flex h-11 items-center bg-accent px-6 text-12 tracking-nav text-ivory hover:bg-accent/90 disabled:opacity-50"
              >
                {pendingId === deleteTarget.id ? "Siliniyor…" : "Evet, sil"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NewCategoryForm({
  existingSlugs,
  onCreated,
  onCancel,
}: {
  existingSlugs: string[];
  onCreated: () => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tree, setTree] = useState<DraftCategoryNode[]>([]);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = name.trim();
    if (!title) {
      setError("Kategori adı gerekli.");
      return;
    }

    const slug = toSlug(title);
    if (!slug) {
      setError("Geçerli bir kategori adı girin.");
      return;
    }

    if (isBlockedAdminSlug(slug) || existingSlugs.includes(slug)) {
      setError("Bu kategori yolu zaten kullanılıyor.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const created = await createAdminApiCategory({
        name: title,
        slug,
        description: description.trim(),
        isActive: visible,
      });
      for (const node of tree) {
        await createDraftTree(node, created.id);
      }
      await onCreated();
    } catch (caught) {
      if (caught instanceof AdminApiError && caught.code === "CONFLICT") {
        setError("Bu kategori yolu zaten kullanılıyor.");
      } else {
        setError(getAdminErrorMessage(caught));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <p className="text-12 tracking-label text-black">Yeni kategori</p>
      <label className="text-12 tracking-label text-charcoal">
        Kategori adı
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
        />
      </label>
      <label className="text-12 tracking-label text-charcoal">
        Açıklama
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 min-h-24 w-full border border-border bg-ivory px-4 py-3 text-14"
        />
      </label>
      <DraftCategoryTree nodes={tree} onChange={setTree} />
      <label className="flex min-h-11 items-center gap-3 text-14 text-charcoal">
        <input
          type="checkbox"
          checked={visible}
          onChange={(event) => setVisible(event.target.checked)}
        />
        Aktif / mağazada görünür
      </label>
      {error ? <p className="text-14 text-accent">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-12 items-center bg-charcoal px-6 text-12 tracking-nav text-ivory hover:bg-black disabled:opacity-50"
        >
          {saving ? "Kaydediliyor" : "Oluştur"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-12 items-center border border-charcoal px-6 text-12 tracking-nav text-charcoal"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}

function CategoryEditor({
  row,
  disabled,
  onSaved,
  onTreeChanged,
  onToggle,
  onDelete,
}: {
  row: CategoryDto;
  disabled: boolean;
  onSaved: (updated: CategoryDto) => void;
  onTreeChanged: () => Promise<void>;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [nextTitle, setNextTitle] = useState(row.name);
  const [nextDescription, setNextDescription] = useState(row.description);
  const [saving, setSaving] = useState(false);
  const [treeBusy, setTreeBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleAddChild = async (parentId: string | null, name: string) => {
    setError("");
    setSuccess("");
    setTreeBusy(true);
    try {
      await createAdminApiCategory({
        name,
        slug: toSlug(name) || "kategori",
        description: "",
        isActive: true,
        parentId: parentId ?? row.id,
      });
      await onTreeChanged();
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setTreeBusy(false);
    }
  };

  const handleRemoveChild = async (id: string) => {
    setError("");
    setSuccess("");
    setTreeBusy(true);
    try {
      await deleteAdminApiCategory(id);
      await onTreeChanged();
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setTreeBusy(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        setSaving(true);
        void updateAdminApiCategory(row.id, {
          name: nextTitle.trim() || row.name,
          description: nextDescription.trim(),
        })
          .then((updated) => {
            onSaved(updated);
            setSuccess("Kaydedildi.");
          })
          .catch((caught) => {
            setError(getAdminErrorMessage(caught));
          })
          .finally(() => {
            setSaving(false);
          });
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-12 tracking-label text-taupe">
          /{row.slug} · {row.isActive ? "Yayında" : "Gizli"}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled || saving || treeBusy}
            onClick={onToggle}
            className="inline-flex h-11 items-center border border-charcoal px-4 text-12 tracking-nav text-charcoal hover:bg-charcoal hover:text-ivory disabled:opacity-50"
          >
            {row.isActive ? "Gizle" : "Yayınla"}
          </button>
          <button
            type="button"
            disabled={disabled || saving || treeBusy}
            onClick={onDelete}
            className="inline-flex h-11 items-center px-4 text-12 tracking-nav text-accent disabled:opacity-50"
          >
            Sil
          </button>
        </div>
      </div>
      <label className="text-12 tracking-label text-charcoal">
        Başlık
        <input
          value={nextTitle}
          onChange={(event) => setNextTitle(event.target.value)}
          className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
        />
      </label>
      <label className="text-12 tracking-label text-charcoal">
        Açıklama
        <textarea
          value={nextDescription}
          onChange={(event) => setNextDescription(event.target.value)}
          className="mt-2 min-h-24 w-full border border-border bg-ivory px-4 py-3 text-14"
        />
      </label>
      <div className={treeBusy ? "pointer-events-none opacity-60" : ""}>
        <SavedCategoryTree
          nodes={row.children}
          onAdd={handleAddChild}
          onRemove={handleRemoveChild}
        />
      </div>
      {error ? <p className="text-14 text-accent">{error}</p> : null}
      {success ? <p className="text-14 text-charcoal">{success}</p> : null}
      <button
        type="submit"
        disabled={disabled || saving || treeBusy}
        className="inline-flex h-12 w-fit items-center bg-charcoal px-6 text-12 tracking-nav text-ivory hover:bg-black disabled:opacity-50"
      >
        {saving ? "Kaydediliyor" : "Kaydet"}
      </button>
    </form>
  );
}
