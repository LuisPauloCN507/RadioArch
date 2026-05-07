export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-6xl font-black tracking-tighter">
          Radio<span className="text-orange-500">Arch</span>
        </h1>
        <p className="mt-4 text-zinc-400 text-xl font-light">
          A rádio do Piauí, personalizada por você.
        </p>
        
        <div className="mt-12 p-8 border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur-sm">
          <p className="text-sm uppercase tracking-widest text-zinc-500 font-bold">Status do Projeto</p>
          <h2 className="text-2xl mt-2 font-semibold">Ambiente configurado com sucesso! 🚀</h2>
          <p className="mt-4 text-zinc-400">
            Próximo passo: Criar a grade de estações (Jovem Pan, Meio Norte e mais).
          </p>
        </div>
      </div>
    </main>
  );
}