"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { createModel, deleteModel, updateModel } from "./actions";
import type { ModelFormInput } from "./types";

function diffCount(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let count = 0;
  for (const id of setA) if (!setB.has(id)) count += 1;
  for (const id of setB) if (!setA.has(id)) count += 1;
  return count;
}

export function useModelForm({
  initial,
  slug,
}: {
  initial?: {
    name: string;
    description: string;
    pullIds: string[];
    pushIds: string[];
  };
  slug?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [pullIds, setPullIds] = useState<string[]>(initial?.pullIds ?? []);
  const [pushIds, setPushIds] = useState<string[]>(initial?.pushIds ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const unsavedChanges = useMemo(() => {
    if (!initial) return 0;
    let count = 0;
    if (name !== initial.name) count += 1;
    if (description !== initial.description) count += 1;
    count += diffCount(pullIds, initial.pullIds);
    count += diffCount(pushIds, initial.pushIds);
    return count;
  }, [name, description, pullIds, pushIds, initial]);

  function save() {
    if (!name.trim() || isSaving) return;
    setError(null);
    const input: ModelFormInput = {
      name,
      description,
      pullVariableIds: pullIds,
      pushVariableIds: pushIds,
    };

    startSaving(async () => {
      try {
        if (slug) {
          await updateModel(slug, input);
          router.push(`/models/${slug}`);
          router.refresh();
        } else {
          const created = await createModel(input);
          router.push(`/models/${created.slug}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function remove() {
    if (!slug) return;
    const confirmed = window.confirm(
      `Delete "${name}"? Existing run history keeps its own label and just loses the model link.`,
    );
    if (!confirmed) return;

    startDeleting(async () => {
      try {
        await deleteModel(slug);
        router.push("/models");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return {
    name,
    setName,
    description,
    setDescription,
    pullIds,
    setPullIds,
    pushIds,
    setPushIds,
    error,
    isSaving,
    isDeleting,
    unsavedChanges,
    save,
    remove,
  };
}
