"use client";

import { useState } from "react";

import { Plus, X } from "lucide-react";

import type { CategoryChildDto } from "@/types/api";

export type DraftCategoryNode = {
  key: string;
  name: string;
  children: DraftCategoryNode[];
};

function newKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyDraftNode(name: string): DraftCategoryNode {
  return { key: newKey(), name, children: [] };
}

function AddRow({
  onAdd,
  placeholder,
}: {
  onAdd: (name: string) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const name = value.trim();
    if (!name) {
      return;
    }
    onAdd(name);
    setValue("");
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="h-11 min-w-40 flex-1 border border-border bg-ivory px-3 text-14"
      />
      <button
        type="button"
        onClick={submit}
        className="inline-flex h-11 items-center border border-charcoal px-4 text-12 tracking-nav text-charcoal hover:bg-charcoal hover:text-ivory"
      >
        Ekle
      </button>
    </div>
  );
}

function DraftNodeCard({
  node,
  onChange,
  onRemove,
}: {
  node: DraftCategoryNode;
  onChange: (next: DraftCategoryNode) => void;
  onRemove: () => void;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="border border-border bg-ivory p-3">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-14 text-charcoal">{node.name}</p>
        <button
          type="button"
          title="Alt kategori ekle"
          aria-label="Alt kategori ekle"
          onClick={() => setAdding((current) => !current)}
          className="group relative flex h-9 w-9 items-center justify-center text-charcoal hover:bg-warm-beige/50"
        >
          <Plus size={16} strokeWidth={1.6} />
          <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap border border-border bg-ivory px-2 py-1 text-12 text-charcoal shadow-sm group-hover:block">
            Alt kategori ekle
          </span>
        </button>
        <button
          type="button"
          aria-label="Kaldır"
          onClick={onRemove}
          className="flex h-9 w-9 items-center justify-center text-accent"
        >
          <X size={16} strokeWidth={1.6} />
        </button>
      </div>
      {adding ? (
        <AddRow
          placeholder={`${node.name} altına yazın`}
          onAdd={(name) => {
            onChange({
              ...node,
              children: [...node.children, emptyDraftNode(name)],
            });
            setAdding(false);
          }}
        />
      ) : null}
      {node.children.length > 0 ? (
        <div className="mt-3 ml-4 flex flex-col gap-2">
          {node.children.map((child) => (
            <DraftNodeCard
              key={child.key}
              node={child}
              onChange={(next) =>
                onChange({
                  ...node,
                  children: node.children.map((item) =>
                    item.key === child.key ? next : item,
                  ),
                })
              }
              onRemove={() =>
                onChange({
                  ...node,
                  children: node.children.filter((item) => item.key !== child.key),
                })
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DraftCategoryTree({
  nodes,
  onChange,
}: {
  nodes: DraftCategoryNode[];
  onChange: (nodes: DraftCategoryNode[]) => void;
}) {
  return (
    <div>
      <p className="text-12 tracking-label text-charcoal">Alt kategoriler</p>
      <AddRow
        placeholder="Alt kategori adı"
        onAdd={(name) => onChange([...nodes, emptyDraftNode(name)])}
      />
      {nodes.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {nodes.map((node) => (
            <DraftNodeCard
              key={node.key}
              node={node}
              onChange={(next) =>
                onChange(nodes.map((item) => (item.key === node.key ? next : item)))
              }
              onRemove={() => onChange(nodes.filter((item) => item.key !== node.key))}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SavedCategoryTree({
  nodes,
  onAdd,
  onRemove,
}: {
  nodes: CategoryChildDto[];
  onAdd: (parentId: string | null, name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  return (
    <div>
      <p className="text-12 tracking-label text-charcoal">Alt kategoriler</p>
      <AddRow placeholder="Alt kategori adı" onAdd={(name) => void onAdd(null, name)} />
      {nodes.filter((node) => node.isActive).length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {nodes
            .filter((node) => node.isActive)
            .map((node) => (
              <SavedNodeCard
                key={node.id}
                node={node}
                onAdd={onAdd}
                onRemove={onRemove}
              />
            ))}
        </div>
      ) : null}
    </div>
  );
}

function SavedNodeCard({
  node,
  onAdd,
  onRemove,
}: {
  node: CategoryChildDto;
  onAdd: (parentId: string | null, name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="border border-border bg-ivory p-3">
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-14 text-charcoal">{node.name}</p>
        <button
          type="button"
          title="Alt kategori ekle"
          aria-label="Alt kategori ekle"
          onClick={() => setAdding((current) => !current)}
          className="group relative flex h-9 w-9 items-center justify-center text-charcoal hover:bg-warm-beige/50"
        >
          <Plus size={16} strokeWidth={1.6} />
          <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap border border-border bg-ivory px-2 py-1 text-12 text-charcoal shadow-sm group-hover:block">
            Alt kategori ekle
          </span>
        </button>
        <button
          type="button"
          aria-label="Kaldır"
          onClick={() => void onRemove(node.id)}
          className="flex h-9 w-9 items-center justify-center text-accent"
        >
          <X size={16} strokeWidth={1.6} />
        </button>
      </div>
      {adding ? (
        <AddRow
          placeholder={`${node.name} altına yazın`}
          onAdd={(name) => {
            void onAdd(node.id, name).then(() => setAdding(false));
          }}
        />
      ) : null}
      {node.children.filter((child) => child.isActive).length > 0 ? (
        <div className="mt-3 ml-4 flex flex-col gap-2">
          {node.children
            .filter((child) => child.isActive)
            .map((child) => (
              <SavedNodeCard
                key={child.id}
                node={child}
                onAdd={onAdd}
                onRemove={onRemove}
              />
            ))}
        </div>
      ) : null}
    </div>
  );
}
