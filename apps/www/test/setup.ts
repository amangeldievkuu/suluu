import "@testing-library/jest-dom/vitest";

// Node-environment tests (the filesystem parity check) share this setup file.
if (typeof window !== "undefined") {
  installDomStubs();
}

function installDomStubs() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      addEventListener: () => undefined,
      addListener: () => undefined,
      dispatchEvent: () => false,
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: () => undefined,
      removeListener: () => undefined,
    }),
    writable: true,
  });

  // jsdom 30 ships HTMLDialogElement but not showModal/close, so the search
  // palette's open state is unobservable without this. It stands in for the
  // open/closed bookkeeping only — the real focus trap is the browser's, and
  // is therefore verified by hand rather than here.
  const dialogPrototype = window.HTMLDialogElement.prototype as unknown as {
    close?: () => void;
    showModal?: () => void;
  };

  dialogPrototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.open = true;
  };

  dialogPrototype.close ??= function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}
