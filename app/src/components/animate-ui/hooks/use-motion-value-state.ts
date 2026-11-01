// Nguồn: Animate UI (https://github.com/imskyleen/animate-ui) — registry v1,
// sao chép theo cơ chế registry kiểu shadcn (file thuộc về codebase của dự án sau khi cài).
// License: MIT + Commons Clause (dùng trong ứng dụng/website, không bán/phân phối lại component).
import * as React from 'react';
import { type MotionValue } from 'motion/react';

function useMotionValueState(motionValue: MotionValue): number {
  return React.useSyncExternalStore(
    (callback) => {
      const unsub = motionValue.on('change', callback);
      return unsub;
    },
    () => motionValue.get(),
    () => motionValue.get(),
  );
}

export { useMotionValueState };
