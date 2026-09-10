import StillStudio from './designs/still/StillStudio'
import './designs/typography/fonts.css'
import './designs/typography/variants/book.css'
import './designs/mobile/layout.css'
import './designs/mobile/variants/chapters.css'

export default function Homepage() {
  return (
    <div className="type-preview mobile-preview" data-typography="book" data-mobile-study="chapters">
      <StillStudio finalized mobileStudy="chapters" />
    </div>
  )
}
