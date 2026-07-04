import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import GridLines from './components/GridLines'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './routes/Home'
import Publications from './routes/Publications'
import Photography from './routes/Photography'
import CV from './routes/CV'

export default function App() {
  const location = useLocation()
  const reduce = useReducedMotion()

  // Draw the grid rules + enable reveals once mounted. A short timeout (not
  // rAF) is used deliberately: rAF is paused in background tabs, and since
  // .reveal starts hidden we must guarantee the class lands so content is
  // never stuck invisible. The small delay still leaves a paint frame for the
  // entrance transition to animate from.
  useEffect(() => {
    if (document.body.classList.contains('gs-ready')) return
    const t = setTimeout(() => document.body.classList.add('gs-ready'), 40)
    return () => clearTimeout(t)
  }, [])

  // Scroll to top on route change (each nav item is its own page).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'auto' })
  }, [location.pathname, reduce])

  return (
    <div className="relative min-h-screen">
      <GridLines />
      <Nav />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="page frame"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: reduce ? 0 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/publications" element={<Publications />} />
            <Route path="/cv" element={<CV />} />
            <Route path="/photography" element={<Photography />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  )
}
