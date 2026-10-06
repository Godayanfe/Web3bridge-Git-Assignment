//  import Card from "./Card";
 export default function Table() {
  return (
    <>
    <main className="table">
      <div className="canvas" id="canvas" aria-label="Card stack of guessed avatars"></div>
      {/* <Card svgMarkup={svgMarkup} /> */}

      <p className="empty-state" id="emptyState">
        Every wrong guess drops a new card onto the pile.
        Click a card to bring it up front, or swipe the pile left / right to cycle through it.
      </p>
    </main>
    </>
  )
};