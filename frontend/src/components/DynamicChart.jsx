import React, { useRef } from 'react'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  CategoryScale,
  BarElement,
  Title,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js'
import { Scatter, Bar, Line, Doughnut, Radar } from 'react-chartjs-2'

ChartJS.register(
  LinearScale, PointElement, LineElement, Tooltip, Legend,
  CategoryScale, BarElement, Title, ArcElement, RadialLinearScale, Filler
)

export default function DynamicChart({ data, type = 'scatter', title = 'Resultado Visual', labels, datasets, xLabel, yLabel }) {
  const chartRef = useRef(null)

  const downloadChart = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image()
      const link = document.createElement('a')
      link.download = `grafico_papermetrics_${new Date().getTime()}.png`
      link.href = url
      link.click()
    }
  }

  const tooltipStyle = {
    backgroundColor: '#1c1c1a',
    titleColor: '#5eead4',
    bodyColor: '#e7e5e4',
    borderColor: 'rgba(94, 234, 212, 0.2)',
    borderWidth: 1,
    cornerRadius: 8,
    padding: 12
  }

  const axisLabelStyle = {
    display: true,
    color: 'rgba(255,255,255,0.55)',
    font: { size: 11, family: 'Inter', weight: '500' },
    padding: 6
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        color: 'rgba(255, 255, 255, 0.7)',
        font: { size: 14, family: 'Inter', weight: '600' }
      },
      tooltip: tooltipStyle
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#78716c', font: { size: 11 } },
        title: xLabel ? { ...axisLabelStyle, text: xLabel } : { display: false }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#78716c', font: { size: 11 } },
        title: yLabel ? { ...axisLabelStyle, text: yLabel } : { display: false }
      }
    }
  }

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        color: 'rgba(255, 255, 255, 0.7)',
        font: { size: 14, family: 'Inter', weight: '600' }
      },
      tooltip: tooltipStyle
    },
    scales: {
      r: {
        grid: { color: 'rgba(255,255,255,0.08)' },
        angleLines: { color: 'rgba(255,255,255,0.08)' },
        pointLabels: { color: '#78716c', font: { size: 11 } },
        ticks: { display: false }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        color: 'rgba(255, 255, 255, 0.7)',
        font: { size: 14, family: 'Inter', weight: '600' }
      },
      tooltip: tooltipStyle
    }
  }

  const scatterData = {
    datasets: [{
      label: 'Amostras',
      data: data || [],
      backgroundColor: 'rgba(94, 234, 212, 0.6)',
      borderColor: '#5eead4',
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  }

  const barData = {
    labels: labels || (data ? data.map(d => d.label) : []),
    datasets: datasets || [{
      label: 'Valor',
      data: data ? data.map(d => d.value) : [],
      backgroundColor: 'rgba(94, 234, 212, 0.2)',
      borderColor: '#5eead4',
      borderWidth: 1,
      borderRadius: 4
    }]
  }

  const lineData = {
    labels: labels || (data ? data.map(d => d.label) : []),
    datasets: datasets || [{
      label: 'Tendência',
      data: data ? data.map(d => d.value) : [],
      borderColor: '#5eead4',
      backgroundColor: 'rgba(94, 234, 212, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#5eead4',
      pointBorderColor: '#5eead4',
      pointHoverRadius: 7,
      borderWidth: 2
    }]
  }

  const radarData = {
    labels: labels || [],
    datasets: datasets || [{
      label: 'Perfil',
      data: data ? data.map(d => d.value) : [],
      backgroundColor: 'rgba(94, 234, 212, 0.15)',
      borderColor: '#5eead4',
      borderWidth: 2,
      pointBackgroundColor: '#5eead4',
      pointRadius: 4
    }]
  }

  const doughnutData = {
    labels: labels || [],
    datasets: datasets || [{
      data: data ? data.map(d => d.value) : [],
      backgroundColor: [
        'rgba(94, 234, 212, 0.7)',
        'rgba(147, 51, 234, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(251, 146, 60, 0.7)',
        'rgba(244, 63, 94, 0.7)',
        'rgba(34, 211, 238, 0.7)'
      ],
      borderColor: [
        'rgba(94, 234, 212, 1)',
        'rgba(147, 51, 234, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(251, 146, 60, 1)',
        'rgba(244, 63, 94, 1)',
        'rgba(34, 211, 238, 1)'
      ],
      borderWidth: 1,
      hoverOffset: 8
    }]
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="absolute top-0 right-0 z-10">
        <button
          onClick={downloadChart}
          title="Exportar Gráfico (PNG)"
          className="p-2 bg-white/5 hover:bg-primary/20 text-stone-400 hover:text-primary rounded-xl transition-all"
        >
          <span className="material-symbols-rounded text-sm">download</span>
        </button>
      </div>
      <div className="flex-1 w-full min-h-[250px]">
        {type === 'scatter' && <Scatter ref={chartRef} options={commonOptions} data={scatterData} />}
        {type === 'bar' && <Bar ref={chartRef} options={commonOptions} data={barData} />}
        {type === 'line' && <Line ref={chartRef} options={commonOptions} data={lineData} />}
        {type === 'radar' && <Radar ref={chartRef} options={radarOptions} data={radarData} />}
        {type === 'doughnut' && <Doughnut ref={chartRef} options={doughnutOptions} data={doughnutData} />}
      </div>
    </div>
  )
}
