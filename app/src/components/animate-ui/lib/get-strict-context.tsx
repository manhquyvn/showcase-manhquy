// Nguồn: Animate UI (https://github.com/imskyleen/animate-ui) — registry v1,
// sao chép theo cơ chế registry kiểu shadcn (file thuộc về codebase của dự án sau khi cài).
// License: MIT + Commons Clause (dùng trong ứng dụng/website, không bán/phân phối lại component).
import * as React from 'react';

function getStrictContext<T>(
  name?: string,
): readonly [
  ({
    value,
    children,
  }: {
    value: T;
    children?: React.ReactNode;
  }) => React.JSX.Element,
  () => T,
] {
  const Context = React.createContext<T | undefined>(undefined);

  const Provider = ({
    value,
    children,
  }: {
    value: T;
    children?: React.ReactNode;
  }) => <Context.Provider value={value}>{children}</Context.Provider>;

  const useSafeContext = () => {
    const ctx = React.useContext(Context);
    if (ctx === undefined) {
      throw new Error(`useContext must be used within ${name ?? 'a Provider'}`);
    }
    return ctx;
  };

  return [Provider, useSafeContext] as const;
}

export { getStrictContext };
