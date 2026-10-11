// voxel.js — the game's own blocks, drawn as isometric cubes for the deck.
//
// lean-mc generates its texture atlas rather than loading one: every texel is
// a pure function of the tile and the pixel (`LeanMc/Shell/Atlas.lean`). That
// function is ported here line for line, so a block in a diagram is the block
// in the footage, texel for texel, with no image files to keep in step.
//
// Two blocks are not the game's, and each stands for one of the talk's two
// systems. Basalt is drawn after Minecraft's, with the same kind of noise the
// game's own textures are made of. The die is Palamedes's: he is the Greek
// credited with inventing dice.

/** `Atlas.hash`: 32-bit arithmetic, hence the `imul` and the `>>> 0`s. */
const hash = (x, y, salt) => {
  let h = (x * 374761393 + y * 668265263 + salt * 2246822519) % 4294967296
  h = Math.imul((h ^ (h >>> 13)) >>> 0, 1274126177) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

const jitter = (x, y, salt, amp) => (hash(x, y, salt) % (2 * amp + 1)) - amp

const rgb = (r, g, b, d = 0) => [r + d, g + d, b + d]

/** `Atlas.tilePixel`: the colour of pixel (x, y) of a tile, y = 0 at the top. */
function tilePixel(tile, x, y) {
  const dirt = rgb(134, 96, 67, jitter(x, y, 2, 12))
  const grass = rgb(96, 160, 54, jitter(x, y, 3, 14))
  switch (tile) {
    case 1:
      return rgb(128, 128, 128, jitter(x, y, 1, 10)) // stone
    case 2:
      return dirt
    case 3:
      return grass // grass top
    case 4:
      return y < 3 + (hash(x, 0, 4) % 3) ? grass : dirt // grass side
    case 5:
      return rgb(219, 207, 163, jitter(x, y, 5, 8)) // sand
    case 6: // log side
      return rgb(103, 82, 50, jitter(x, 0, 6, 14) + jitter(x, y, 6, 4))
    case 7: {
      // log top
      const ring = Math.floor(Math.max(Math.abs(2 * x - 15), Math.abs(2 * y - 15)) / 4)
      return ring % 2 === 0
        ? rgb(172, 138, 86, jitter(x, y, 7, 5))
        : rgb(128, 100, 58, jitter(x, y, 7, 5))
    }
    case 9: // planks
      return y % 4 === 3
        ? rgb(112, 88, 52)
        : rgb(166, 134, 82, jitter(x, y, 9, 5) + jitter(0, Math.floor(y / 4), 9, 8))
    case 10: {
      // cobble
      const sx = x + (Math.floor(y / 4) % 2) * 2
      return sx % 4 === 0 || y % 4 === 0
        ? rgb(78, 78, 78, jitter(x, y, 10, 6))
        : rgb(
            126,
            126,
            126,
            jitter(Math.floor(sx / 4), Math.floor(y / 4), 10, 22) + jitter(x, y, 11, 5),
          )
    }
    case 20:
      return basaltSide(x, y)
    case 21:
      return basaltTop(x, y)
    default:
      return tile in PIPS ? diePixel(tile, x, y) : [255, 0, 255]
  }
}

// The die's three faces: where each pip's top-left texel is. A pip is four
// texels square, so three of them and four one-texel gaps fill a row.
const PIPS = {
  100: [[1, 1], [11, 1], [6, 6], [1, 11], [11, 11]],
  101: [[1, 1], [6, 6], [11, 11]],
  102: [[11, 1], [1, 11]],
}

/** A face of the die: bone white, with the stage showing through the pips. */
function diePixel(tile, x, y) {
  const pip = PIPS[tile].some(([px, py]) => x >= px && x < px + 4 && y >= py && y < py + 4)
  // --bg in deck.css
  return pip ? [28, 30, 36] : rgb(238, 233, 220, jitter(x, y, 12, 5))
}

// Basalt is columnar: it cools into six-sided columns, so the end of a block
// shows a honeycomb of them and the side shows the columns standing. The four
// greys run light to dark; the darkest leans blue, as the cracks in
// Minecraft's do.
const BASALT = [
  [132, 132, 136],
  [110, 110, 116],
  [84, 84, 92],
  [38, 39, 54],
]

// Basalt is drawn at twice the grain of the game's blocks, 32 texels to a
// face: at 16 a hexagon is too few texels to look like one.
const BASALT_TEXELS = 32

// The columns are COLUMN texels across, flat side to flat side: three to a
// face, with one whole hexagon in the middle of it.
const COLUMN = BASALT_TEXELS / 3
const ROW = (COLUMN * Math.sqrt(3)) / 2

/**
 * The end of the columns. A texel belongs to the column whose centre is
 * nearest, and is crack where the next nearest is almost as near.
 */
function basaltTop(x, y) {
  let near = Infinity
  let next = Infinity
  let cell = 0
  for (let row = -3; row <= 3; row++) {
    for (let col = -2; col <= 2; col++) {
      const cx = BASALT_TEXELS / 2 + col * COLUMN + (row % 2 === 0 ? 0 : COLUMN / 2)
      const cy = BASALT_TEXELS / 2 + row * ROW
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      if (d < near) {
        next = near
        near = d
        cell = hash(col + 4, row + 4, 23)
      } else if (d < next) {
        next = d
      }
    }
  }
  if (next - near < 1.2) return rgb(...BASALT[3], jitter(x, y, 24, 4))
  return rgb(...BASALT[cell % 3], jitter(x, y, 25, 5))
}

/**
 * The columns from the side, four to a face, with a crack down every join and
 * now and then a break across one.
 */
function basaltSide(x, y) {
  const face = BASALT_TEXELS / 4
  const column = Math.floor(x / face)
  const crack = x % face === 0 || hash(column, y, 21) % 47 === 0
  if (crack) return rgb(...BASALT[3], jitter(x, y, 20, 4))
  const run = Math.floor((y + (hash(x, 0, 22) % 12)) / 12)
  const streak = hash(x, run, 27) % 4 === 0 ? 1 : 0
  const grey = BASALT[1 + ((hash(column, 0, 26) + streak) % 2)]
  return rgb(...grey.map((v) => v - 22), jitter(x, y, 28, 4))
}

// Tile numbers as in `Block.tile`: which tile a block shows on top and on its
// two visible sides.
const BLOCKS = {
  grass: { top: 3, left: 4, right: 4 },
  stone: { top: 1, left: 1, right: 1 },
  cobble: { top: 10, left: 10, right: 10 },
  planks: { top: 9, left: 9, right: 9 },
  sand: { top: 5, left: 5, right: 5 },
  log: { top: 7, left: 6, right: 6 },
  basalt: { top: 21, left: 20, right: 20 },
  die: { top: 100, left: 101, right: 102 },
}

// How much light each visible face gets. The game dims a face by the way it
// points; these are the three values that come out in its screenshots.
const SHADE = { top: 1, left: 0.84, right: 0.68 }

// A tile is 16 texels square (basalt's, 32), and is drawn 256 pixels square,
// so a face stays sharp at any size a slide sets it.
const TEXELS = 16
const SIZE = 256

function faceImage(tile, shade) {
  const texels = tile === 20 || tile === 21 ? BASALT_TEXELS : TEXELS
  const zoom = SIZE / texels
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  for (let y = 0; y < texels; y++) {
    for (let x = 0; x < texels; x++) {
      const [r, g, b] = tilePixel(tile, x, y).map((v) =>
        Math.round(Math.max(0, Math.min(255, v)) * shade),
      )
      ctx.fillStyle = `rgb(${r} ${g} ${b})`
      ctx.fillRect(x * zoom, y * zoom, zoom, zoom)
    }
  }
  return canvas.toDataURL('image/png')
}

// A cube in unit coordinates: the top vertex is the origin, the top face is a
// rhombus two wide and one tall, and a vertical edge is EDGE long. A slide
// places one with `transform="translate(x y) scale(s)"`, where s is half the
// cube's width in pixels; it then spans x ± s and y to y + s(1 + EDGE).
export const EDGE = 1.118

const HULL = `M0,0 L1,.5 V${0.5 + EDGE} L0,${1 + EDGE} L-1,${0.5 + EDGE} V.5 Z`

/**
 * Fill `svg` with one `<g id="blk-NAME">` per block, plus `#blk-hull`, the
 * silhouette, as a bare path to stroke.
 *
 * The definitions live in an SVG of their own, outside the slides: a `<use>`
 * that points into a hidden slide's SVG stops rendering.
 */
export function installBlocks(svg) {
  const face = (tile, shade, matrix) =>
    `<image href="${faceImage(tile, shade)}" width="1" height="1" ` +
    `preserveAspectRatio="none" transform="matrix(${matrix})"/>`

  const blocks = Object.entries(BLOCKS).map(([name, { top, left, right }]) => {
    // The plain hull under the faces takes up the hairline that antialiasing
    // would otherwise leave along the edges where two faces meet.
    const [r, g, b] = tilePixel(right, 9, 9).map((v) => Math.round(v * SHADE.right))
    return (
      `<g id="blk-${name}">` +
      `<path d="${HULL}" fill="rgb(${r} ${g} ${b})"/>` +
      face(top, SHADE.top, '1 .5 -1 .5 0 0') +
      face(left, SHADE.left, `1 .5 0 ${EDGE} -1 .5`) +
      face(right, SHADE.right, `1 -.5 0 ${EDGE} 0 1`) +
      `</g>`
    )
  })

  svg.innerHTML =
    `<defs>${blocks.join('')}` +
    `<path id="blk-hull" d="${HULL}" vector-effect="non-scaling-stroke"/>` +
    `</defs>`
}
