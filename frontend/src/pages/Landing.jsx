import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function ForestPlot({ className }) {
  return (
    <svg viewBox="0 0 40 20" preserveAspectRatio="xMidYMid meet" className={className} fill="currentColor">
      <rect x="0" y="8" width="40" height="4" />
      <polygon points="20,0 30,10 20,20 10,10" />
    </svg>
  )
}

const features = [
  {
    title: 'Análise automática por IA',
    description: 'Nossa IA detecta automaticamente os tipos de variáveis e sugere os testes estatísticos mais adequados para sua pesquisa.',
    icon: 'psychology'
  },
  {
    title: 'Motor estatístico profissional',
    description: 'Powered by Pingouin — o mesmo utilizado em artigos científicos de alto impacto. Precisão clínica garantida.',
    icon: 'analytics'
  },
  {
    title: 'Interpretação em português',
    description: 'Resultados interpretados automaticamente em português claro. Sem jargon estatístico complexo.',
    icon: 'translate'
  },
  {
    title: 'Gráficos interativos',
    description: 'Visualize seus dados com gráficos exportáveis para PowerPoint, PDF e Excel.',
    icon: 'show_chart'
  },
  {
    title: 'Análise de sobrevivência',
    description: 'Kaplan-Meier, Log-Rank e Modelo de Cox integrados para suas pesquisas com dados de tempo.',
    icon: 'timeline'
  },
  {
    title: 'Metanálise completa',
    description: 'Combinação de estudos com modelos de efeito fixo e aleatório. Detecção de viés de publicação.',
    icon: 'hub'
  }
]

const plans = [
  {
    name: 'Explorador',
    price: 'Grátis',
    period: '',
    description: 'Perfeito para começar sua jornada',
    features: ['Análises básicas', 'Até 5 variáveis', 'Gráficos básicos', 'Exportação CSV'],
    cta: 'Começar grátis',
    highlighted: false
  },
  {
    name: 'Pesquisador',
    price: 'R$ 29',
    period: '/mês',
    description: 'Para pesquisadores focados',
    features: ['Análises ilimitadas', 'Até 50 variáveis', 'Gráficos avançados', 'Exportação completa', 'Análise de sobrevivência', 'Metanálise básica'],
    cta: 'Assinar agora',
    highlighted: true
  },
  {
    name: 'Academia',
    price: 'R$ 79',
    period: '/mês',
    description: 'Para laboratórios e orientadores',
    features: ['Tudo do Pesquisador', 'Variáveis ilimitadas', 'Metanálise completa', 'Relatórios APA', 'Suporte prioritário', 'API de integração'],
    cta: 'Falar com vendas',
    highlighted: false
  }
]

const faqs = [
  { q: 'Quais tipos de arquivo posso enviar?', a: 'Aceitamos CSV, Excel (.xlsx) e Google Sheets. O sistema detecta automaticamente o formato dos dados.' },
  { q: 'Preciso saber estatística para usar?', a: 'Não! Nossa IA sugere automaticamente o teste mais adequado e interpreta os resultados em português claro.' },
  { q: 'Os resultados são válidos para publicação?', a: 'Sim. Utilizamos o Pingouin, biblioteca estatística validada cientificamente. Os resultados seguem o padrão APA-7.' },
  { q: 'Posso usar para TCC e doutorado?', a: 'Absolutamente. Muitos estudantes de mestrado e doutorado usam o Paper Metrics para análises de dissertações e teses.' },
  { q: 'Tem análise de sobrevivência?', a: 'Sim! Inclui Kaplan-Meier, Log-Rank e Modelo de Cox para suas pesquisas com dados de tempo até evento.' }
]

const testimonials = [
  { name: 'Dra. Camila Santos', role: 'Residente de Clínica Médica - USP', quote: 'O Paper Metrics salvou minha residência. Consegui fazer todas as análises do meu TCC em minutos, não semanas.', avatar: 'CS' },
  { name: 'Prof. Ricardo Almeida', role: 'Orientador - UNIFESP', quote: 'Recomendo para todos os meus orientandos. A interpretação em português facilita muito o entendimento dos resultados.', avatar: 'RA' },
  { name: 'Dr. Lucas Oliveira', role: 'Pós-doutorando - Einstein', quote: 'A análise de sobrevivência é excelente. Usei para meu projeto de pesquisa e os resultados foram exatamente os esperados.', avatar: 'LO' }
]

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-[#0a0a09] text-[#e7e5e4] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-[#0a0a09]/80 border-b border-[#292524]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 text-[#5eead4]">
              <span className="text-xl font-semibold tracking-[-1px]">Paper</span>
              <ForestPlot className="w-5 h-2.5" />
              <span className="text-xl font-semibold tracking-[-1px]">Metrics</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-[#a8a29e] hover:text-[#e7e5e4] transition-colors text-sm font-medium">Recursos</a>
              <a href="#como-funciona" className="text-[#a8a29e] hover:text-[#e7e5e4] transition-colors text-sm font-medium">Como funciona</a>
              <a href="#planos" className="text-[#a8a29e] hover:text-[#e7e5e4] transition-colors text-sm font-medium">Planos</a>
              <a href="#faq" className="text-[#a8a29e] hover:text-[#e7e5e4] transition-colors text-sm font-medium">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <a href="/login" className="hidden sm:block px-4 py-2 text-sm font-medium text-[#a8a29e] hover:text-[#e7e5e4] transition-colors">Entrar</a>
              <a href="/login" className="px-4 sm:px-5 py-2 bg-[#5eead4] hover:bg-[#99f6e4] text-[#134e4a] font-semibold text-sm rounded-lg transition-all">
                Começar grátis
              </a>
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#a8a29e] hover:text-[#e7e5e4]"
              >
                <span className="material-symbols-rounded text-2xl">{mobileMenu ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>

          {/* Mobile menu drawer */}
          <AnimatePresence>
            {mobileMenu && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden border-t border-[#292524]"
              >
                <div className="flex flex-col gap-1 p-4">
                  <a href="#recursos" onClick={() => setMobileMenu(false)} className="px-4 py-3 text-[#a8a29e] hover:text-[#e7e5e4] hover:bg-[#111110] rounded-lg transition-colors text-sm font-medium">Recursos</a>
                  <a href="#como-funciona" onClick={() => setMobileMenu(false)} className="px-4 py-3 text-[#a8a29e] hover:text-[#e7e5e4] hover:bg-[#111110] rounded-lg transition-colors text-sm font-medium">Como funciona</a>
                  <a href="#planos" onClick={() => setMobileMenu(false)} className="px-4 py-3 text-[#a8a29e] hover:text-[#e7e5e4] hover:bg-[#111110] rounded-lg transition-colors text-sm font-medium">Planos</a>
                  <a href="#faq" onClick={() => setMobileMenu(false)} className="px-4 py-3 text-[#a8a29e] hover:text-[#e7e5e4] hover:bg-[#111110] rounded-lg transition-colors text-sm font-medium">FAQ</a>
                  <a href="/login" onClick={() => setMobileMenu(false)} className="px-4 py-3 text-[#5eead4] hover:bg-[#111110] rounded-lg transition-colors text-sm font-medium">Entrar</a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5eead4]/10 border border-[#5eead4]/20 text-[#5eead4] text-sm font-medium mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[#5eead4] animate-pulse" />
              Agora com análise de sobrevivência
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-7xl font-semibold tracking-[-1.5px] mb-6 leading-[1.05]"
            >
              Análise estatística
              <br />
              <span className="text-[#5eead4]">sem complicação</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-[#a8a29e] mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              O motor estatístico inteligente para pesquisadores. Faça upload dos seus dados e receba análises completas com interpretação em português — pronto para publicação.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a href="/login" className="w-full sm:w-auto px-8 py-3.5 bg-[#5eead4] hover:bg-[#99f6e4] text-[#134e4a] font-semibold text-base rounded-lg transition-all">
                Começar análise grátis
              </a>
              <a href="#como-funciona" className="w-full sm:w-auto px-8 py-3.5 border border-[#292524] hover:border-[#57534e] text-[#a8a29e] font-medium text-base rounded-lg transition-all hover:bg-[#111110]">
                Ver como funciona
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 text-sm text-[#57534e]"
            >
              Não precisa de cartão de crédito · Análise básica gratuita
            </motion.p>
          </div>

          {/* Hero Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 relative"
          >
            <div className="rounded-xl overflow-hidden border border-[#292524] bg-[#111110]">
              <div className="p-4 border-b border-[#292524] flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#57534e]/50" />
                <div className="w-3 h-3 rounded-full bg-[#57534e]/50" />
                <div className="w-3 h-3 rounded-full bg-[#57534e]/50" />
                <span className="ml-4 text-xs text-[#57534e]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Paper Metrics Dashboard</span>
              </div>
              <div className="p-6 min-h-[300px] flex items-center justify-center">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 rounded-lg bg-[#0a0a09] border border-[#292524] flex items-center justify-center">
                      <span className="material-symbols-rounded text-3xl text-[#5eead4]/20">analytics</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-24 bg-[#111110]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[42px] font-semibold tracking-[-1px] mb-4">Três passos simples</h2>
            <p className="text-[#a8a29e] max-w-xl mx-auto">Da inscrição à aprovação, sem complicação.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Conecte', description: 'Faça upload do seu arquivo CSV ou Excel. O sistema detecta automaticamente o formato dos dados.' },
              { step: '02', title: 'Analise', description: 'Nossa IA processa seus dados, detecta variáveis e executa os testes estatísticos mais adequados.' },
              { step: '03', title: 'Conquiste', description: 'Receba resultados completos com interpretação em português e exporte para seu artigo.' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative p-8 rounded-xl bg-[#111110] border border-[#292524] hover:border-[#5eead4]/30 transition-all"
              >
                <span className="text-6xl font-semibold text-[#292524] absolute top-4 right-6">{item.step}</span>
                <h3 className="text-lg font-semibold mb-3 text-[#5eead4]">{item.title}</h3>
                <p className="text-[#a8a29e] leading-relaxed text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[42px] font-semibold tracking-[-1px] mb-4">Tudo que você precisa</h2>
            <p className="text-[#a8a29e] max-w-xl mx-auto">Ferramentas profissionais para elevar a qualidade das suas análises.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-[#111110] border border-[#292524] hover:border-[#5eead4]/30 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#5eead4]/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-rounded text-[#5eead4] text-xl">{feature.icon}</span>
                </div>
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-[#a8a29e] text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-[#292524]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '50K+', label: 'Análises realizadas' },
              { number: '98%', label: 'Satisfação' },
              { number: '500+', label: 'Instituições' },
              { number: '24/7', label: 'Suporte' }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-semibold text-[#5eead4] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{stat.number}</div>
                <div className="text-[#a8a29e] text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[42px] font-semibold tracking-[-1px] mb-4">Escolha seu plano</h2>
            <p className="text-[#a8a29e] max-w-xl mx-auto">Comece grátis. Assine quando precisar.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`p-8 rounded-xl border relative ${
                  plan.highlighted
                    ? 'bg-[#134e4a]/10 border-[#5eead4]/40'
                    : 'bg-[#111110] border-[#292524] hover:border-[#57534e]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#5eead4] text-[#134e4a] text-xs font-semibold rounded-full">
                    Mais popular
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  <span className="text-[#57534e] text-sm">{plan.period}</span>
                </div>
                <p className="text-[#a8a29e] text-sm mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-[#a8a29e]">
                      <span className="material-symbols-rounded text-[#5eead4] text-lg">check_circle</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-lg font-medium text-sm transition-all ${
                  plan.highlighted
                    ? 'bg-[#5eead4] hover:bg-[#99f6e4] text-[#134e4a]'
                    : 'border border-[#292524] hover:border-[#57534e] text-[#a8a29e] hover:bg-[#111110]'
                }`}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-[#111110]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[42px] font-semibold tracking-[-1px] mb-4">O que dizem os pesquisadores</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-[#111110] border border-[#292524]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#134e4a] flex items-center justify-center text-[#5eead4] font-semibold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-[#57534e] text-xs">{t.role}</div>
                  </div>
                </div>
                <p className="text-[#a8a29e] text-sm italic leading-relaxed">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[42px] font-semibold tracking-[-1px] mb-4">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="border border-[#292524] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-[#111110] transition-colors"
                >
                  <span className="font-medium text-sm">{faq.q}</span>
                  <span className={`material-symbols-rounded text-[#57534e] transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-[#a8a29e] text-sm">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-[#292524]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-[42px] font-semibold tracking-[-1px] mb-6">Pronto para elevar suas análises?</h2>
          <p className="text-[#a8a29e] mb-10 max-w-xl mx-auto">
            Junte-se a milhares de pesquisadores que já estão usando o Paper Metrics para produzir análises de alta qualidade.
          </p>
          <a href="/login" className="inline-block px-8 py-3.5 bg-[#5eead4] hover:bg-[#99f6e4] text-[#134e4a] font-semibold text-base rounded-lg transition-all">
            Começar análise grátis
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#292524]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2 text-[#5eead4]">
              <span className="text-lg font-semibold tracking-[-1px]">Paper</span>
              <ForestPlot className="w-4 h-2" />
              <span className="text-lg font-semibold tracking-[-1px]">Metrics</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#57534e]">
              <a href="#" className="hover:text-[#e7e5e4] transition-colors">Termos</a>
              <a href="#" className="hover:text-[#e7e5e4] transition-colors">Privacidade</a>
              <a href="#" className="hover:text-[#e7e5e4] transition-colors">Contato</a>
            </div>
            <div className="text-sm text-[#57534e]">
              © 2026 Paper Metrics. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
