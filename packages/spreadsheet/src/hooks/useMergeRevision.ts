import { useSyncExternalStore } from "react";
import type { MergeStore } from "../store/MergeStore";

export function useMergeRevision(mergeStore: MergeStore): number {
  return useSyncExternalStore(
    (onStoreChange) => mergeStore.subscribe(onStoreChange),
    () => mergeStore.getRevision(),
    () => mergeStore.getRevision(),
  );
}
