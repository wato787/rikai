import { useCallback, useState } from "react";

export type UseToggleReturn = {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
  handleToggle: () => void;
};

/**
 * モーダル開閉など。各ハンドラは参照安定。
 */
export function useToggle(initialOpen = false): UseToggleReturn {
  const [isOpen, setOpen] = useState(initialOpen);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleToggle = useCallback(() => setOpen((v) => !v), []);

  return { isOpen, handleOpen, handleClose, handleToggle };
}
