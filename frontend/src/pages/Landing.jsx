import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const features = [
  {
    title: 'Análise Automática por IA',
    description: 'Nossa IA detecta automaticamente os tipos de variáveis e sugere os testes estatísticos mais adequados para sua pesquisa.',
    icon: 'psychology'
  },
  {
    title: 'Motor Estatístico Profissional',
    description: 'Powered by Pingouin — o mesmo utilizado em artigos científicos de alto impacto. Precisão clínica garantida.',
    icon: 'analytics'
  },
  {
    title: 'Interpretação em Português',
    description: 'Resultados interpretados automaticamente em português claro. Sem jargon estatístico complexo.',
    icon: 'translate'
  },
  {
    title: 'Gráficos Interativos',
    description: 'Visualize seus dados com gráficos beautiful e exportáveis para PowerPoint, PDF e Excel.',
    icon: 'show_chart'
  },
  {
    title: 'Análise de Sobrevivência',
    description: 'Kaplan-Meier, Log-Rank e Modelo de Cox integrados para suas pesquisas com dados de tempo.',
    icon: 'timeline'
  },
  {
    title: 'Metanálise Completa',
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
    features: [
      'Análises básicas',
      ' até 5 variáveis',
      'Gráficos básicos',
      'Exportação CSV'
    ],
    cta: 'Começar Grátis',
    highlighted: false
  },
  {
    name: 'Pesquisador',
    price: 'R$ 29',
    period: '/mês',
    description: 'Para pesquisadores focados',
    features: [
      'Análises ilimitadas',
      ' até 50 variáveis',
      'Gráficos avançados',
      'Exportação completa',
      'Análise de sobrevivência',
      'Metanálise básica'
    ],
    cta: 'Assinar Agora',
    highlighted: true
  },
  {
    name: 'Academia',
    price: 'R$ 79',
    period: '/mês',
    description: 'Para laboratórios e orientadores',
    features: [
      'Tudo do Pesquisador',
      'Variáveis ilimitadas',
      'Metanálise completa',
      'Relatórios APA',
      'Suporte prioritário',
      'API de integração'
    ],
    cta: 'Falar com Vendas',
    highlighted: false
  }
]

const faqs = [
  {
    q: 'Quais tipos de arquivo posso enviar?',
    a: 'Aceitamos CSV, Excel (.xlsx) e Google Sheets. O sistema detecta automaticamente o formato dos dados.'
  },
  {
    q: 'Preciso saber estatística para usar?',
    a: 'Não! Nossa IA sugere automaticamente o teste mais adequado e interpreta os resultados em português claro.'
  },
  {
    q: 'Os resultados são válidos para publicação?',
    a: 'Sim. Utilizamos o Pingouin, biblioteca estatística validada cientificamente. Os resultados seguem o padrão APA-7.'
  },
  {
    q: 'Posso usar para TCC e doutorado?',
    a: 'Absolutamente. Muitos estudantes de mestrado e doutorado usam o Paper Metrics para análises de dissertações e teses.'
  },
  {
    q: 'Tem análise de sobrevivência?',
    a: 'Sim! Inclui Kaplan-Meier, Log-Rank e Modelo de Cox para suas pesquisas com dados de tempo até evento.'
  }
]

const testimonials = [
  {
    name: 'Dra. Camila Santos',
    role: 'Residente de Clínica Médica - USP',
    quote: 'O Paper Metrics salvou minha residência. Consegui fazer todas as análises do meu TCC em minutos, não semanas.',
    avatar: 'CS'
  },
  {
    name: 'Prof. Ricardo Almeida',
    role: 'Orientador - UNIFESP',
    description: 'Recomendo para todos os meus orientandos. A interpretação em português facilita muito o entendimento dos resultados.',
    avatar: 'RA'
  },
  {
    name: 'Dr. Lucas Oliveira',
    role: 'Pós-doutorando - Einstein',
    quote: 'A análise de sobrevivência é excelente. Usei para meu projeto de pesquisa e os resultados foram exatamente os esperados.',
    avatar: 'LO'
  }
]

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-gray-950/80 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/papermetrics_icon_dark_128px.png" alt="PM" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-black tracking-tight">Paper<span className="text-emerald-400"> Metrics</span></span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Recursos</a>
              <a href="#como-funciona" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Como Funciona</a>
              <a href="#planos" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Planos</a>
              <a href="#faq" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <a href="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Entrar</a>
              <a href="/login" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25">
                Começar Grátis
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Agora com análise de sobrevivência
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight"
            >
              Análise estatística
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                sem complicação
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              O motor estatístico inteligente para pesquisadores. Faça upload dos seus dados e receba análises completas com interpretação em português — pronto para publicação.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a 
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-base rounded-2xl transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                Começar análise grátis
              </a>
              <a 
                href="#como-funciona"
                className="w-full sm:w-auto px-8 py-4 border border-gray-700 hover:border-gray-600 text-gray-300 font-medium text-base rounded-2xl transition-all hover:bg-gray-800/50"
              >
                Ver como funciona
              </a>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 text-sm text-gray-500"
            >
              Não precisa de cartão de crédito • Análise básica gratuita
            </motion.p>
          </div>

          {/* Hero Image/Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 relative"
          >
            <div className="rounded-2xl overflow-hidden border border-gray-800 bg-gray-900/50 backdrop-blur-sm shadow-2xl">
              <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-4 text-xs text-gray-500 font-mono">Paper Metrics Dashboard</span>
              </div>
              <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-950 min-h-[300px] flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center">
                      <span className="material-symbols-rounded text-3xl text-emerald-500/30">analytics</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-24 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Três passos simples
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Da inscrição à aprovação, sem complicação.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
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
                className="relative p-8 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-emerald-500/30 transition-all group"
              >
                <span className="text-6xl font-black text-gray-800/50 absolute top-4 right-6 group-hover:text-emerald-500/20 transition-colors">
                  {item.step}
                </span>
                <h3 className="text-xl font-bold mb-3 text-emerald-400">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Ferramentas profissionais para elevar a qualidade das suas análises.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-emerald-500/30 transition-all hover:bg-gray-800/30"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-rounded text-emerald-400 text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '50K+', label: 'Análises realizadas' },
              { number: '98%', label: 'Satisfação' },
              { number: '500+', label: 'Instituições' },
              { number: '24/7', label: 'Suporte' }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-black text-emerald-400 mb-2">{stat.number}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Escolha seu plano
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Comece grátis. Assine quando precisar.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`p-8 rounded-2xl border relative ${
                  plan.highlighted 
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-xl shadow-emerald-500/10' 
                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-gray-950 text-xs font-bold rounded-full">
                    Mais Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-gray-300">
                      <span className="material-symbols-rounded text-emerald-400 text-lg">check_circle</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  plan.highlighted
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-gray-950 hover:shadow-lg hover:shadow-emerald-500/25'
                    : 'border border-gray-700 hover:border-gray-600 text-gray-300 hover:bg-gray-800'
                }`}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              O que dizem os pesquisadores
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-gray-950 font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.quote || testimonial.description}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Perguntas Frequentes
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="border border-gray-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-900/50 transition-colors"
                >
                  <span className="font-medium">{faq.q}</span>
                  <span className={`material-symbols-rounded text-gray-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
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
                      <p className="px-5 pb-5 text-gray-400">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-emerald-900/30 to-teal-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">
            Pronto para elevar suas análises?
          </h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            Junte-se a milhares de pesquisadores que já estão usando o Paper Metrics para produzir análises de alta qualidade.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-base rounded-2xl transition-all hover:shadow-xl hover:shadow-emerald-500/25"
            >
              Começar análise grátis
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <img src="/papermetrics_icon_dark_128px.png" alt="PM" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-black tracking-tight">Paper<span className="text-emerald-400"> Metrics</span></span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Contato</a>
            </div>
            
            <div className="text-sm text-gray-500">
              © 2026 Paper Metrics. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}