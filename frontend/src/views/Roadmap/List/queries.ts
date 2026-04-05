/** `Detail/queries` の `roadmapsQueryKey` と同一である必要がある */
export const roadmapsQueryKey = ["roadmaps"] as const;

export const roadmapsListQueryKey = [...roadmapsQueryKey, "list"] as const;
