declare module "react" {
  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useCallback<T extends (...args: unknown[]) => unknown>(callback: T, deps: unknown[]): T;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useRef<T>(initial: T): { current: T };
  export function useContext<T>(context: Context<T>): T;
  export function createContext<T>(defaultValue: T): Context<T>;
  export interface Context<T> {}
  export function forwardRef<T, P>(render: (props: P, ref: T) => JSX.Element): (props: P & { ref?: React.Ref<T> }) => JSX.Element;
  export type Ref<T> = { current: T | null } | ((instance: T | null) => void) | null;
  export type JSXElement = unknown;
}

declare module "react-dom" {
  export function createRoot(element: HTMLElement): { render: (ui: unknown) => void };
  export function hydrate(element: HTMLElement, ui: unknown): void;
}