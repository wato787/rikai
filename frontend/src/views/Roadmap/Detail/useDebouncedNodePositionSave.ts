import { Debouncer } from "@tanstack/react-pacer";
import { useCallback, useEffect, useRef } from "react";

type SaveFn = (nodeId: string, x: number, y: number) => void;

type Options = {
  wait: number;
  /** クリーンアップ時に保留中の保存を flush する単位（ロードマップ切替・離脱） */
  flushScopeKey: string;
};

/**
 * ノード ID ごとに独立した `Debouncer`（@tanstack/react-pacer が再エクスポート）で
 * ドラッグ終了の連打をまとめる。`useDebouncer` はフック数がノード数に追従できないためクラスを使用。
 * `flushScopeKey` 変化／アンマウント時は `flush()` で保留分を実行する。
 */
export function useDebouncedNodePositionSave(save: SaveFn, { wait, flushScopeKey }: Options) {
  const saveRef = useRef(save);
  saveRef.current = save;

  const debouncersRef = useRef(new Map<string, Debouncer<SaveFn>>());

  useEffect(() => {
    const map = debouncersRef.current;
    return () => {
      for (const d of map.values()) {
        d.flush();
      }
      map.clear();
    };
  }, [flushScopeKey]);

  return useCallback(
    (nodeId: string, x: number, y: number) => {
      let d = debouncersRef.current.get(nodeId);
      if (!d) {
        d = new Debouncer<SaveFn>(
          (id, px, py) => {
            saveRef.current(id, px, py);
          },
          { wait, key: `roadmap-node-position:${nodeId}` },
        );
        debouncersRef.current.set(nodeId, d);
      }
      d.maybeExecute(nodeId, x, y);
    },
    [wait],
  );
}
