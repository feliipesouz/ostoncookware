import Link from "next/link";

export default function NotFound() {
  return (
    <main className="site-grid flex min-h-[70vh] flex-col justify-center">
      <p className="text-[0.7rem] tracking-[0.42em] uppercase text-brand">404</p>
      <h1 className="font-display mt-4 text-5xl">Página não encontrada</h1>
      <Link href="/" className="mt-8 text-sm uppercase tracking-[0.28em]">
        Voltar à OSTON
      </Link>
    </main>
  );
}
