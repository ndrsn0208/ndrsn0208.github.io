import RobotFilm from './RobotFilm'
import { diffusionRobot } from './media'

export default function DiffusionLead() {
  return (
    <figure className="diff-lead" aria-label="The hammer task before and after learning nine more tasks">
      <RobotFilm />
      <figcaption className="diff-lead-caption">
        <p><strong>Does the first skill survive nine more tasks?</strong> The same hammer task, immediately after learning it and again after learning the rest of CW10.</p>
        <a href={diffusionRobot.src} download="continual-learning-diffusion-models.mp4">Download video <span aria-hidden="true">↓</span></a>
      </figcaption>
    </figure>
  )
}
