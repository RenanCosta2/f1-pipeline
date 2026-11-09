import { Github } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 lg:mt-20 border-t border-white/10 bg-[#07070A] text-f1-subtle text-xs pt-8 pb-28 md:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-10 shrink-0 items-center justify-center rounded-lg bg-f1-red font-black italic tracking-tighter text-white text-xs shadow-md shadow-f1-red/30">
              F1
            </div>
            <div>
              <span className="text-sm font-black uppercase tracking-wider text-white">
                Pit<span className="text-f1-red">wall</span>
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Central independente de inteligência de corrida, telemetria e análise estatística da Fórmula 1.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Feed de Dados Operacional</span>
            </div>

            <a
              href="https://github.com/RenanCosta2/f1-pipeline"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-colors"
              title="Acessar repositório no GitHub"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>

        {/* Disclaimer Legal & Copyright */}
        <div className="border-t border-white/5 pt-6 text-[11px] text-zinc-500 space-y-2 leading-relaxed">
          <p>
            © {currentYear} Pitwall Motorsport Intelligence. Todos os direitos reservados.
          </p>
          <p className="text-[10px] text-zinc-500/80">
            Aviso Legal: Este projeto é uma plataforma independente de análise de dados e não é afiliado, associado, autorizado, endossado ou de qualquer forma oficialmente conectado à Formula One Licensing B.V., Formula One Management (FOM), Fédération Internationale de l&apos;Automobile (FIA) ou a qualquer de suas subsidiárias e afiliados. Os nomes F1, FORMULA 1, FORMULA ONE, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX e marcas relacionadas são marcas comerciais registradas de titularidade de seus respectivos proprietários.
          </p>
        </div>
      </div>
    </footer>
  );
}
