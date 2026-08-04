type DataChangeListener = () => void;

const listeners = new Set<DataChangeListener>();

export function emitDataChanged(): void {
  listeners.forEach(listener => {
    try {
      listener();
    } catch {
      // a listener must never break other listeners
    }
  });
}

export function subscribeDataChanged(listener: DataChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
