/** The page's drawing, small, wherever the page is listed: one play as a row of moves, read at the budgets k and twice k. */
export default function TeaseEmblem() {
  return (
    <div className="essay-figure-moves" role="img"
      aria-label="One play of a table of five steps as a row of ten moves. After three moves nothing happens, the next five are plan steps, and the last of them reaches the goal within twice the number of steps.">
      {Array.from({ length: 10 }, (_, index) => <span key={index} className="tease-square" data-kind={index < 3 ? 'nothing' : index < 7 ? 'step' : index === 7 ? 'goal' : 'none'} />)}
    </div>
  )
}
