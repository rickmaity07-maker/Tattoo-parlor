// All photography sourced from Unsplash (free-to-use).
// Cropped and sized for cinematic placement.

const u = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=85`;

export const IMG = {
  // Hero — needle / atmosphere, vertical energy
  hero: u("photo-1598371839696-5c5bb00bdc28", 2400, 1600),
  heroAlt: u("photo-1761276297686-f507ca9fe8b6", 2400, 1600),

  // Studio atmosphere
  studio: u("photo-1516008684536-605574d804ce", 2400, 1400),
  studioDark: u("photo-1550537687-c91072c4792d", 2000, 1400),

  // Artists
  artistBearded: u("photo-1753259789341-808371092e19", 1400, 1800),
  artistMono: u("photo-1552627019-947c3789ffb5", 1400, 1800),

  // Work
  processBack: u("photo-1594812332797-bec39ee15b47", 1600, 2000),
  armDesign: u("photo-1665085326630-b01fea9a613d", 1400, 1750),
  floralNeck: u("photo-1562379825-415aea84ebcf", 1400, 1750),
  handsClose: u("photo-1761276297686-f507ca9fe8b6", 1600, 1200),
  monoProcess: u("photo-1552627019-947c3789ffb5", 1600, 1200),
  blackworkDetail: u("photo-1562962230-16e4623d36e6", 1400, 1600),
  fineLine: u("photo-1611501271407-f28c242f3609", 1400, 1600),
  realism: u("photo-1572915858631-c49b068a74e5", 1400, 1600),
};

export const styles = [
  {
    name: "Blackwork",
    blurb: "Solid saturation. Heavy contrast. Built to hold density for decades.",
    image: IMG.processBack,
  },
  {
    name: "Fine Line",
    blurb: "Single-needle detail — botanical, script, portraiture at a whisper.",
    image: IMG.fineLine,
  },
  {
    name: "Ornamental",
    blurb: "Botanical linework that follows the body’s own architecture.",
    image: IMG.floralNeck,
  },
  {
    name: "Traditional",
    blurb: "Bold outline, limited palette. The kind of tattoo that ages correctly.",
    image: IMG.armDesign,
  },
];

export const artists = [
  {
    name: "Cole Marrow",
    role: "Owner · Blackwork & Script",
    bio: "Twelve years behind the machine. Cole designs around the body’s existing lines before the needle ever touches skin.",
    image: IMG.artistBearded,
  },
  {
    name: "Rae Osei",
    role: "Fine Line & Ornamental",
    bio: "Trained in botanical illustration. Rae’s linework reads like ink on paper — only permanent.",
    image: IMG.artistMono,
  },
];

export const gallery = [
  { image: IMG.processBack, caption: "Blackwork panel — full back, 4 sessions", tall: true },
  { image: IMG.armDesign, caption: "Fine line forearm, single sitting", tall: false },
  { image: IMG.floralNeck, caption: "Ornamental floral, side neck", tall: false },
  { image: IMG.handsClose, caption: "Studio floor, mid-session", tall: false },
  { image: IMG.blackworkDetail, caption: "Solid black, negative space study", tall: true },
  { image: IMG.studio, caption: "Studio No. 9 after hours", tall: false },
];

export const process = [
  {
    step: "01",
    title: "Consultation",
    body: "References, placement, or nothing at all. We talk sizing, style fit, and a rough estimate before anything is booked.",
  },
  {
    step: "02",
    title: "Design",
    body: "Your artist drafts the piece and sends it for review. A deposit holds the date and comes off the final price.",
  },
  {
    step: "03",
    title: "Session",
    body: "Stencil, placement check, then the work. Longer pieces are split so the skin — and the line — stay clean.",
  },
  {
    step: "04",
    title: "Aftercare",
    body: "Written aftercare, a two-week check-in, and one complimentary touch-up within twelve months.",
  },
];

export const testimonials = [
  {
    quote: "Cole spent twenty minutes just looking at how the piece would sit before we started. It shows.",
    name: "J. Alvarez",
  },
  {
    quote: "Rae turned three reference photos into something none of us had actually seen before.",
    name: "M. Okafor",
  },
  {
    quote: "Quiet, precise, no ego. The kind of shop you send your parents to.",
    name: "S. Novak",
  },
];

export const faqs = [
  {
    q: "How do I book?",
    a: "Fill out the inquiry form or email us. We’ll respond within 48 hours with availability and next steps.",
  },
  {
    q: "Do you take walk-ins?",
    a: "We work by appointment only. This keeps the space calm and gives every piece the time it needs.",
  },
  {
    q: "What about deposits?",
    a: "A deposit is required to hold your date. It is non-refundable but applied fully to the final cost of the work.",
  },
  {
    q: "Aftercare?",
    a: "You’ll leave with written instructions and a second-skin recommendation. We check in at two weeks.",
  },
];
