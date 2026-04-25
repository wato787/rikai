import { useCallback, useState } from "react";

export type UseToggleReturn = {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
};

/**
 * モーダル開閉など。各ハンドラは参照安定。
 */
export function useToggle(initialOpen = false): UseToggleReturn {
  const [isOpen, setOpen] = useState(initialOpen);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return { isOpen, handleOpen, handleClose };
}
