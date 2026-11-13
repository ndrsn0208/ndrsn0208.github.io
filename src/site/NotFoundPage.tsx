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
      <h1>This page is not here.</h1>
      <p className="site-inline"><Link to={href('/')}>Back to the overview</Link></p>
    </header>
  </main>
}

export default function NotFoundPage() {
  return <SiteFrame page="home"><NotFoundContent /></SiteFrame>
}
