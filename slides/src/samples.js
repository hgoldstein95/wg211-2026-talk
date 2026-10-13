// samples.js — a grid of values a generator made, under a listing.
//
// In index.html, a `.samples` is a fragment that holds one `<span>` a value:
//
//     <div class="samples fragment">
//       <span>some 513</span> <span class="ok">none</span>
//     </div>
//
// Its press draws the values, one just after another, and every value not
// marked `ok` is struck out as it lands. Reveal drives the press, and the look
// and the motion are the "What a generator made" rules of deck.css. This file
// numbers the values, which is what staggers them, and paints each with the
// grammar every listing uses. What a value says goes in a span of its own, so
// that it can dim after the value has arrived.
//
// `marks` beside `samples` is a smaller grid that strikes nothing out. There,
// a value marked `mark` is pointed out as it lands.

function prepare(root, hljs) {
  ;[...root.querySelectorAll(':scope > span')].forEach((el, i) => {
    el.style.setProperty('--i', i)
    el.innerHTML = `<span>${hljs.highlight(el.textContent, { language: 'lean' }).value}</span>`
  })
}

export function initSamples(Reveal, hljs) {
  // Queried afresh for print, which builds one page per fragment step, each
  // with its own copy of the slide.
  const update = () => {
    for (const root of document.querySelectorAll('.samples')) prepare(root, hljs)
  }

  Reveal.on('pdf-ready', update)
  update()
}
