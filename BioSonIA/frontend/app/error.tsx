"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>Se produjo un error</h1>
      <p>{error?.message}</p>
      <button onClick={() => reset()}>Reintentar</button>
    </div>
  );
}
