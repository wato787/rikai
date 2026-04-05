/** `List/queries` の `roadmapsQueryKey` と同一である必要がある */
export const roadmapsQueryKey = ["roadmaps"] as const;

export function roadmapsDetailQueryKey(id: string) {
  return [...roadmapsQueryKey, "detail", id] as const;
}
