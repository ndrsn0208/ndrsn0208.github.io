import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Nav from './components/Nav'
import Home from './routes/Home'
import Publications from './routes/Publications'
import PublicationDetail from './routes/PublicationDetail'
import Blog from './routes/Blog'
import Photography from './routes/Photography'

export default function App() {
  const location = useLocation()
  const reduce = useReducedMotion()

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* ambient background */}
      <div className="haze pointer-events-none">
        <div className="haze-c" />
        <div className="haze-d" />
      </div>
      <div className="grid-bg pointer-events-none" />
      <div className="grain pointer-events-none" />

      <div className="relative z-10">
        <Nav />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={reduce ? false : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.99 }}
            transition={{
              duration: reduce ? 0 : 0.4,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/publications" element={<Publications />} />
              <Route path="/publications/:id" element={<PublicationDetail />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/photography" element={<Photography />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}
