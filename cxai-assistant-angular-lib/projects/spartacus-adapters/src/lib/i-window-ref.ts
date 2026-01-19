
export abstract class IWindowRef {
  abstract get nativeWindow(): Window | undefined;
  abstract get sessionStorage(): Storage | undefined;
  abstract get localStorage(): Storage | undefined;
  abstract isBrowser(): boolean;
}
