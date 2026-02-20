import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

function App() {
  const [dream, setDream] = useState('')
  const [school, setSchool] = useState('荣格式')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  const canvasRef = useRef(null)

  useEffect(() => {
    initParticles()
  }, [])

  const initParticles = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = []
    const particleCount = 80

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.2,
        twinkle: Math.random() * Math.PI * 2
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(p => {
        p.x += p.speedX
        p.y += p.speedY
        p.twinkle += 0.02
        
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        const flickerOpacity = p.opacity + Math.sin(p.twinkle) * 0.2
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 220, 255, ${flickerOpacity})`
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    })
  }

  const API_BASE = import.meta.env.VITE_API_URL || '/api'

  const analyzeDream = async () => {
    if (!dream.trim()) return
    
    setIsAnalyzing(true)
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/analyze-dream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream, school })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data)
      } else {
        alert(data.error || '解析失败，请重试')
      }
    } catch (error) {
      alert('连接服务器失败，请确保后端服务已启动')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generatePDF = async () => {
    if (!result) return

    try {
      const response = await fetch(`${API_BASE}/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dream: result.dream,
          school: result.school,
          analysis: result.analysis,
          sections: result.sections,
          symbols: result.symbols
        })
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'dream-analysis-report.pdf'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('报告生成失败')
    }
  }

  const schools = [
    { id: '弗洛伊德式', label: '弗洛伊德式', icon: '🔬', desc: '欲望·压抑·潜意识' },
    { id: '荣格式', label: '荣格式', icon: '🌟', desc: '原型·集体潜意识' }
  ]

  return (
    <div className="app">
      <canvas ref={canvasRef} className="particle-canvas" />
      
      <div className="content">
        <motion.header 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="header"
        >
          <h1 className="title">
            <span className="title-icon">✨</span>
            AI梦境解析器
          </h1>
          <p className="subtitle">探索潜意识的奥秘，解读梦境的启示</p>
        </motion.header>

        <section className="input-section">
          <motion.div 
            className="dream-input-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="input-label">📝 描述你的梦境</label>
            <textarea
              className="dream-input"
              placeholder="请详细描述你的梦境内容，包括场景、人物、事件、感受等..."
              value={dream}
              onChange={(e) => setDream(e.target.value)}
              rows={6}
            />
          </motion.div>

          <motion.div 
            className="school-selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="input-label">🎭 选择解读流派</label>
            <div className="school-buttons">
              {schools.map(s => (
                <button
                  key={s.id}
                  className={`school-btn ${school === s.id ? 'active' : ''}`}
                  onClick={() => setSchool(s.id)}
                >
                  <span className="school-icon">{s.icon}</span>
                  <span className="school-name">{s.label}</span>
                  <span className="school-desc">{s.desc}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.button
            className={`analyze-btn ${isAnalyzing ? 'loading' : ''}`}
            onClick={analyzeDream}
            disabled={isAnalyzing || !dream.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isAnalyzing ? (
              <>
                <span className="loading-spinner"></span>
                梦境凝聚中...
              </>
            ) : (
              <>
                <span className="btn-icon">🔮</span>
                开始解梦
              </>
            )}
          </motion.button>
        </section>

        <AnimatePresence>
          {result && (
            <motion.section 
              className="result-section"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              <div className="result-card">
                <div className="result-header">
                  <h2>🔮 解析结果</h2>
                  <span className="school-tag">{result.school}</span>
                </div>

                <div className="result-content">
                  <motion.div 
                    className="result-block"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3>📖 深度解析</h3>
                    <p>{result.analysis}</p>
                  </motion.div>

                  {result.symbols && result.symbols.length > 0 && (
                    <motion.div 
                      className="result-block"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3>🔑 关键符号</h3>
                      <div className="symbols-list">
                        {result.symbols.map((sym, i) => (
                          <motion.div 
                            key={i}
                            className="symbol-item"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                          >
                            <span className="symbol-name">{sym.symbol}</span>
                            <span className="symbol-meaning">{sym.meaning}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <motion.button
                  className="report-btn"
                  onClick={generatePDF}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📥 生成PDF报告
                </motion.button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
