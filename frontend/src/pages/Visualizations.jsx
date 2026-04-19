import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bar, Line, Scatter } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

const API_URL = import.meta.env.VITE_API_BASE_URL

const VIS_ICONS = {
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6421 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 14L11 10L15 14L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  dots: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

async function generateData(distribution, n, params) {
  const res = await fetch(`${API_URL}/api/data/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ distribution, n, params })
  })
  return res.json()
}

export default function Visualizations() {
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [d1, d2, d3] = await Promise.all([
          generateData('normal', 100, { mean: 50, std: 12 }),
          generateData('normal', 100, { mean: 55, std: 10 }),
          generateData('uniform', 100, { low: 20, high: 80 })
        ])
        setData({ normal1: d1.data, normal2: d2.data, uniform: d3.data })
        setStats({
          normal1: { mean: d1.mean, std: d1.std },
          normal2: { mean: d2.mean, std: d2.std },
          uniform: { mean: d3.mean, std: d3.std }
        })
      } catch {
        setError('Erro ao carregar dados dos gráficos. Verifique se o backend está ativo.')
      }
      setLoading(false)
    }
    load()
  }, [])

  const themeColor = '#5eead4'

  const chartOpts = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { 
        display: true, 
        text: title, 
        font: { size: 11, weight: '900' }, 
        color: 'rgba(255,255,255,0.5)',
        padding: { bottom: 20 },
        textTransform: 'none'
      },
      tooltip: {
        backgroundColor: 'rgba(28, 28, 26, 0.9)',
        titleFont: { size: 11 },
        bodyFont: { size: 10 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: { 
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false }, 
        ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 } } 
      },
      y: { 
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false }, 
        ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 } } 
      },
    }
  })

  const buildHistogram = (values, bins = 12) => {
    if (!values) return { labels: [], counts: [] }
    const min = Math.min(...values)
    const max = Math.max(...values)
    const step = (max - min) / bins
    const counts = Array(bins).fill(0)
    const labels = []
    for (let i = 0; i < bins; i++) {
      const lo = min + i * step
      labels.push(lo.toFixed(0))
      values.forEach(v => { if (v >= lo && v < lo + step) counts[i]++ })
    }
    return { labels, counts }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="text-primary"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
      </motion.div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-[60vh]">
      <p className="text-stone-400 font-bold">{error}</p>
    </div>
  )

  const hist = buildHistogram(data?.normal1)

  const scatterData = {
    datasets: [{
      label: 'Normal A vs Normal B',
      data: data ? data.normal1.map((v, i) => ({ x: v, y: data.normal2[i] })) : [],
      backgroundColor: 'rgba(94, 234, 212, 0.5)',
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  }

  const groupedBarData = {
    labels: ['Normal A', 'Normal B', 'Uniforme'],
    datasets: [
      { label: 'Média', data: stats ? [stats.normal1.mean, stats.normal2.mean, stats.uniform.mean] : [], backgroundColor: themeColor, borderRadius: 4 },
      { label: 'Desvio Padrão', data: stats ? [stats.normal1.std, stats.normal2.std, stats.uniform.std] : [], backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
    ]
  }

  const sortedNormal1 = data ? [...data.normal1].sort((a, b) => a - b) : []
  const cdfLabels = sortedNormal1.filter((_, i) => i % 5 === 0).map(v => v.toFixed(1))
  const cdfValues = sortedNormal1.filter((_, i) => i % 5 === 0).map((_, i) => ((i + 1) / sortedNormal1.length).toFixed(3))

  const cdfChartData = {
    labels: cdfLabels,
    datasets: [{
      label: 'CDF Empírica',
      data: cdfValues,
      borderColor: themeColor,
      backgroundColor: 'rgba(94, 234, 212, 0.05)',
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      borderWidth: 2,
    }]
  }

  return (
    <div className="space-y-10">
      <header>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Visualizações <span className="text-primary">Interativas</span>
          </h1>
          <p className="text-stone-400 max-w-2xl">Explore padrões e tendências nos seus dados científicos com gráficos de alta fidelidade.</p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-semibold tracking-wide text-stone-500">Distribuição Normal</h3>
            <span className="text-primary/50">{VIS_ICONS.chart}</span>
          </div>
          <div className="h-64">
            <Bar 
              data={{
                labels: hist.labels,
                datasets: [{ label: 'Frequência', data: hist.counts, backgroundColor: themeColor, borderRadius: 2 }]
              }} 
              options={chartOpts('Histograma de Frequência')} 
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-semibold tracking-wide text-stone-500">Função de Distribuição Acumulada</h3>
            <span className="text-primary/50">{VIS_ICONS.chart}</span>
          </div>
          <div className="h-64">
            <Line data={cdfChartData} options={chartOpts('CDF Empírica (Normal A)')} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-semibold tracking-wide text-stone-500">Análise Comparativa</h3>
            <span className="text-primary/50">{VIS_ICONS.chart}</span>
          </div>
          <div className="h-64">
            <Bar data={groupedBarData} options={chartOpts('Média vs Desvio Padrão')} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 min-h-[350px] relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-semibold tracking-wide text-stone-500">Resumo de Estatísticas</h3>
            <span className="text-primary/50">{VIS_ICONS.dots}</span>
          </div>
          <div className="space-y-4">
            {stats && [
              { label: 'Normal A', val: stats.normal1.mean.toFixed(1), sub: `± ${stats.normal1.std.toFixed(1)}` },
              { label: 'Normal B', val: stats.normal2.mean.toFixed(1), sub: `± ${stats.normal2.std.toFixed(1)}` },
              { label: 'Uniforme', val: stats.uniform.mean.toFixed(1), sub: `± ${stats.uniform.std.toFixed(1)}` },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
                <div>
                  <p className="text-[10px] font-bold text-stone-500">{stat.label}</p>
                  <p className="text-2xl font-semibold text-white">{stat.val}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-primary">Desvio Padrão</p>
                  <p className="text-sm font-mono text-stone-400">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-semibold tracking-wide text-stone-500">Dispersão Bidimensional</h3>
            <span className="text-primary/50">{VIS_ICONS.chart}</span>
          </div>
          <div className="h-64">
            <Scatter data={scatterData} options={chartOpts('Normal A vs Normal B')} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
