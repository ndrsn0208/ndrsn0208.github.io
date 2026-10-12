import { Link } from 'react-router-dom'
import SiteFrame, { useSiteTheme } from './SiteFrame'
import { useBlogMetadata } from '../blog/BlogLayout'

function NotFoundContent() {
  const { href } = useSiteTheme()
  useBlogMetadata({
    title: 'Page not found · Zekun Wang',
    description: 'Research, publications, and writing by Zekun Wang.',
    path: '/',
    image: '/site-card.png',
    imageAlt: 'Zekun Wang. Research and writing.',
  })
  return <main id="site-main" className="site-container">
    <header className="site-page-intro">
      <p className="site-kicker">404</p>
      <h1>This page has moved.</h1>
      <p>You can find the research, papers, and writing from the homepage.</p>
    </header>
    <Link to={href('/')} className="site-text-link" style={{ marginTop: 28 }}>Back to the overview</Link>
  </main>
}

export default function NotFoundPage() {
  return <SiteFrame page="home"><NotFoundContent /></SiteFrame>
}
