import type {
    Category,
    PageContent,
    Post,
    Price,
    Product,
    Testimonial,
    UgcPost,
    Vibe,
    Workshop,
} from "./types";

const placeholders: Record<string, { label: string; background: string }> = {
    "paint-pack": { label: "Paint Pack Shot", background: "F4EFFF" },
    "paint-action": { label: "Painting In Action", background: "EDF8F5" },
    "stitch-pack": { label: "Stitch & Sew Pack", background: "F4EFFF" },
    "stitch-action": { label: "Sewing In Action", background: "F4EFFF" },
    "clay-pack": { label: "Clay Pack Shot", background: "EDF8F5" },
    "clay-action": { label: "Clay In Action", background: "F4EFFF" },
    "sketch-pack": { label: "Sketch Pack Shot", background: "FFF9EB" },
    "sketch-action": { label: "Sketching In Action", background: "F4EFFF" },
    "kids-pack": { label: "Kids Craft Pack", background: "EDF8F5" },
    "kids-action": { label: "Kids Crafting", background: "FFF9EB" },
    "diy-pack": { label: "DIY Kit Pack", background: "F4EFFF" },
    "diy-action": { label: "DIY Kit In Action", background: "EDF8F5" },
    "bundle-pack": { label: "Bundle Pack Shot", background: "FFF1C7" },
    "bundle-action": { label: "Bundle In Action", background: "FFE3DB" },
};

const image = (name: string, alt: string) => {
    const placeholder = placeholders[name] ?? {
        label: name,
        background: "FFF9EB",
    };

    return {
        src: `https://placehold.co/800x1000/${placeholder.background}/211D19?text=${encodeURIComponent(placeholder.label)}`,
        alt,
    };
};

export function makePrice(
    cents: number,
    regularCents = cents,
    saleCents = cents,
): Price {
    return {
        price: String(cents),
        regular_price: String(regularCents),
        sale_price: String(saleCents),
        currency_code: "KES",
        currency_symbol: "KSh",
        currency_minor_unit: 2,
        currency_decimal_separator: ".",
        currency_thousand_separator: ",",
        currency_prefix: "KSh ",
        currency_suffix: "",
        price_range: null,
    };
}

const category = (
    id: number,
    name: string,
    slug: string,
    description: string,
    imageName: string,
    imageAlt: string,
): Category => ({
    id,
    name,
    slug,
    description,
    count: 0,
    image: image(imageName, imageAlt),
});

export const demoCategories: Category[] = [
    category(
        1,
        "Paint",
        "paint",
        "Acrylics, watercolour, brushes and canvas for your next big idea.",
        "paint-pack",
        "A colourful paint set with brushes and a palette",
    ),
    category(
        2,
        "Stitch & Sew",
        "stitch-sew",
        "Fabric, thread, yarn and everything for the sewing table.",
        "stitch-pack",
        "Fabric, thread and sewing supplies",
    ),
    category(
        3,
        "Clay",
        "clay",
        "Air-dry clay, polymer clay and pottery tools for hands-on making.",
        "clay-pack",
        "Clay, pottery tools and a handmade pot",
    ),
    category(
        4,
        "Sketch",
        "sketch",
        "Sketchbooks, pencils, markers and ink for everyday drawing.",
        "sketch-pack",
        "A sketchbook, pencils and drawing tools",
    ),
    category(
        5,
        "Kids",
        "kids",
        "Safe, colourful projects for small hands and big imaginations.",
        "kids-pack",
        "A kids craft box filled with colourful supplies",
    ),
    category(
        6,
        "DIY Kits",
        "diy-kits",
        "Everything you need in one box, with friendly instructions.",
        "diy-pack",
        "A DIY craft kit with yarn and instructions",
    ),
    category(
        7,
        "Bundles",
        "bundles",
        "Starter sets and gifts for every creative vibe.",
        "bundle-pack",
        "A gift bundle of art and craft supplies",
    ),
];

const paint = demoCategories[0]!;
const stitch = demoCategories[1]!;
const clay = demoCategories[2]!;
const sketch = demoCategories[3]!;
const kids = demoCategories[4]!;
const diy = demoCategories[5]!;
const bundles = demoCategories[6]!;

export const demoProducts: Product[] = [
    {
        id: 101,
        name: "Sunrise Acrylic Paint Set",
        slug: "sunrise-acrylic-paint-set",
        type: "simple",
        description:
            "<p>A 12-tube set of bright, creamy acrylics that mix beautifully and dry to a matte finish. Enough colour for a first canvas, a weekend project or a very ambitious sketchbook page.</p><p>Includes titanium white, lemon yellow, marigold, poppy red, bubblegum pink, violet, cobalt blue, turquoise, leaf green, burnt sienna, umber and black.</p>",
        shortDescription:
            "12 × 20 ml acrylic paints. Bright, blendable and beginner-friendly.",
        images: [
            image(
                "paint-pack",
                "Sunrise acrylic paint set with colourful tubes",
            ),
            image(
                "paint-action",
                "Hands painting a bright canvas with acrylic paint",
            ),
        ],
        hoverImage: image(
            "paint-action",
            "Hands painting a bright canvas with acrylic paint",
        ),
        prices: makePrice(210000, 245000, 210000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [paint],
        stockQuantity: 24,
        featured: true,
        rating: 4.8,
        reviewCount: 126,
        badge: "Village Market Fave",
        attributes: { finish: "Matte", size: "12-Set" },
    },
    {
        id: 102,
        name: "Watercolour Pocket Palette",
        slug: "watercolour-pocket-palette",
        type: "simple",
        description:
            "<p>A compact 24-half-pan watercolour palette with a mixing lid, a travel brush and a soft cotton pouch. The colours are vivid but easy to lift, which makes mistakes feel like part of the process.</p><p>Perfect for sketching at the market, painting in the garden or keeping in your bag for slow afternoons.</p>",
        shortDescription:
            "24 half pans, mixing lid, travel brush and cotton pouch.",
        images: [
            image(
                "paint-pack",
                "Watercolour pocket palette with colourful pans",
            ),
            image("paint-action", "Hand painting with watercolour on paper"),
        ],
        hoverImage: image(
            "paint-action",
            "Hand painting with watercolour on paper",
        ),
        prices: makePrice(320000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [paint],
        stockQuantity: 16,
        featured: true,
        isNew: true,
        rating: 4.9,
        reviewCount: 84,
        badge: "Beginner Friendly",
        attributes: { finish: "Satin", size: "24-Set" },
    },
    {
        id: 103,
        name: "Studio Brush Set",
        slug: "studio-brush-set",
        type: "simple",
        description:
            "<p>Ten synthetic brushes for acrylic, watercolour and gouache: flats, rounds, a filbert, a detail liner and a big soft wash brush. The handles are a cheerful marigold so you can find them in a busy studio.</p><p>Comes in a roll-up canvas wrap that keeps the bristles protected.</p>",
        shortDescription:
            "10 synthetic brushes for acrylic, watercolour and gouache.",
        images: [
            image(
                "paint-pack",
                "A set of artist brushes with marigold handles",
            ),
            image(
                "paint-action",
                "Brushes resting beside a painting in progress",
            ),
        ],
        hoverImage: image(
            "paint-action",
            "Brushes resting beside a painting in progress",
        ),
        prices: makePrice(185000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [paint],
        stockQuantity: 30,
        rating: 4.7,
        reviewCount: 52,
    },
    {
        id: 104,
        name: "Canvas Trio",
        slug: "canvas-trio",
        type: "simple",
        description:
            "<p>Three stretched cotton canvases in 20 × 20 cm, 30 × 30 cm and 40 × 40 cm. Primed and ready for acrylic, oil or mixed media, with sturdy pine frames that will not wobble while you work.</p>",
        shortDescription:
            "Three stretched cotton canvases: 20, 30 and 40 cm square.",
        images: [
            image(
                "paint-pack",
                "Three blank canvases stacked with paint supplies",
            ),
            image("paint-action", "A canvas being painted in a bright studio"),
        ],
        hoverImage: image(
            "paint-action",
            "A canvas being painted in a bright studio",
        ),
        prices: makePrice(280000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [paint],
        stockQuantity: 20,
        isNew: true,
        rating: 4.6,
        reviewCount: 38,
    },
    {
        id: 105,
        name: "Kitenge Fat Quarter Bundle",
        slug: "kitenge-fat-quarter-bundle",
        type: "simple",
        description:
            "<p>Six fat quarters of vibrant kitenge cotton, selected by our shop team for colour and print. Each bundle is a little different, which is half the fun.</p><p>Great for patchwork, pouches, children’s clothes, cushion covers and any project that deserves a bit more colour.</p>",
        shortDescription:
            "Six assorted kitenge cotton fat quarters. 50 × 55 cm each.",
        images: [
            image(
                "stitch-pack",
                "A stack of colourful kitenge fabric quarters",
            ),
            image("stitch-action", "Hands sewing colourful fabric at a table"),
        ],
        hoverImage: image(
            "stitch-action",
            "Hands sewing colourful fabric at a table",
        ),
        prices: makePrice(165000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [stitch],
        stockQuantity: 40,
        featured: true,
        isNew: true,
        rating: 4.9,
        reviewCount: 73,
        badge: "New",
        attributes: { material: "Cotton", skill: "Beginner" },
    },
    {
        id: 106,
        name: "Beginner Sewing Kit",
        slug: "beginner-sewing-kit",
        type: "simple",
        description:
            "<p>Everything you need to start stitching: fabric scissors, small snips, pins, a tape measure, hand needles, a seam ripper, thread in six colours and a magnetic pin dish.</p><p>Packed in a sturdy tin that doubles as a sewing box. The illustrated guide walks you through your first seam, button and hem.</p>",
        shortDescription:
            "A complete starter sewing kit in a reusable tin, with guide.",
        images: [
            image(
                "stitch-pack",
                "A beginner sewing kit with thread and scissors",
            ),
            image(
                "stitch-action",
                "Hands sewing a seam with a needle and thread",
            ),
        ],
        hoverImage: image(
            "stitch-action",
            "Hands sewing a seam with a needle and thread",
        ),
        prices: makePrice(295000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [stitch],
        stockQuantity: 18,
        featured: true,
        rating: 4.8,
        reviewCount: 61,
        badge: "Beginner Friendly",
        attributes: { material: "Cotton", skill: "Beginner" },
    },
    {
        id: 107,
        name: "Embroidery Hoop Kit",
        slug: "embroidery-hoop-kit",
        type: "simple",
        description:
            "<p>Three bamboo hoops, a pack of embroidery needles, six skeins of cotton thread and a printed pattern for a simple flower, a leaf and a tiny sun. The perfect slow-craft project for a Sunday.</p>",
        shortDescription:
            "Three hoops, threads, needles and three beginner patterns.",
        images: [
            image("stitch-pack", "Embroidery hoops, threads and needles"),
            image("stitch-action", "A floral embroidery hoop in progress"),
        ],
        hoverImage: image(
            "stitch-action",
            "A floral embroidery hoop in progress",
        ),
        prices: makePrice(195000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [stitch, diy],
        stockQuantity: 22,
        rating: 4.7,
        reviewCount: 44,
        attributes: {
            material: "Cotton",
            skill: "Beginner",
            craft_type: "Embroidery",
        },
    },
    {
        id: 108,
        name: "Chunky Cotton Yarn",
        slug: "chunky-cotton-yarn",
        type: "variable",
        description:
            "<p>Soft, chunky cotton yarn in colours that look good together. Each skein is 100 g and works up quickly on 6–8 mm needles or a 6 mm hook.</p><p>Choose a single colour for a simple project, or mix three for a blanket that feels like a Nairobi sunset.</p>",
        shortDescription:
            "100 g chunky cotton skein. Choose from four studio colours.",
        images: [
            image("stitch-pack", "Chunky cotton yarn skeins in warm colours"),
            image("stitch-action", "Hands crocheting with chunky cotton yarn"),
        ],
        hoverImage: image(
            "stitch-action",
            "Hands crocheting with chunky cotton yarn",
        ),
        prices: makePrice(135000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: true,
        categories: [stitch],
        stockQuantity: 50,
        featured: true,
        isNew: true,
        rating: 4.8,
        reviewCount: 90,
        attributes: { material: "Cotton", skill: "Beginner" },
        variations: [
            {
                id: 801,
                attributes: [
                    {
                        name: "Colour",
                        value: "Terracotta",
                        slug: "terracotta",
                        taxonomy: "pa_colour",
                    },
                ],
                isInStock: true,
                prices: makePrice(135000),
            },
            {
                id: 802,
                attributes: [
                    {
                        name: "Colour",
                        value: "Sage",
                        slug: "sage",
                        taxonomy: "pa_colour",
                    },
                ],
                isInStock: true,
                prices: makePrice(135000),
            },
            {
                id: 803,
                attributes: [
                    {
                        name: "Colour",
                        value: "Butter",
                        slug: "butter",
                        taxonomy: "pa_colour",
                    },
                ],
                isInStock: true,
                prices: makePrice(135000),
            },
            {
                id: 804,
                attributes: [
                    {
                        name: "Colour",
                        value: "Cobalt",
                        slug: "cobalt",
                        taxonomy: "pa_colour",
                    },
                ],
                isInStock: true,
                prices: makePrice(145000),
            },
        ],
    },
    {
        id: 109,
        name: "Air-Dry Clay Studio Pack",
        slug: "air-dry-clay-studio-pack",
        type: "simple",
        description:
            "<p>Two kilograms of smooth, stone-coloured air-dry clay that needs no kiln. It takes about 24 hours to dry, then can be sanded, painted or sealed.</p><p>Great for small pots, pinch bowls, jewellery dishes and very serious Saturday experiments.</p>",
        shortDescription:
            "2 kg smooth air-dry clay. No kiln needed. Dries in 24 hours.",
        images: [
            image("clay-pack", "A pack of air-dry clay with pottery tools"),
            image("clay-action", "Hands shaping a small clay pot"),
        ],
        hoverImage: image("clay-action", "Hands shaping a small clay pot"),
        prices: makePrice(220000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [clay],
        stockQuantity: 26,
        featured: true,
        rating: 4.6,
        reviewCount: 35,
        attributes: { clay_type: "Air-Dry" },
    },
    {
        id: 110,
        name: "Pottery Tool Kit",
        slug: "pottery-tool-kit",
        type: "simple",
        description:
            "<p>Eight wooden and metal tools for scoring, shaping, smoothing and carving clay. The set includes a wire cutter, a wooden rib, a sponge, a needle tool and four modelling tools.</p><p>Comes in a cotton roll that keeps everything together between studio days.</p>",
        shortDescription:
            "Eight pottery tools in a cotton roll for hand-building and wheel work.",
        images: [
            image("clay-pack", "Pottery tools arranged beside a clay pot"),
            image("clay-action", "Hands using a pottery tool on wet clay"),
        ],
        hoverImage: image(
            "clay-action",
            "Hands using a pottery tool on wet clay",
        ),
        prices: makePrice(175000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [clay],
        stockQuantity: 24,
        rating: 4.5,
        reviewCount: 28,
        attributes: { clay_type: "Pottery Tool" },
    },
    {
        id: 111,
        name: "Layflat Sketchbook",
        slug: "layflat-sketchbook",
        type: "simple",
        description:
            "<p>An A4 sketchbook with 120 gsm paper that lies flat when open, so you can work across the spread without fighting the spine. The paper takes graphite, ink, light watercolour and marker.</p><p>128 pages, warm white, with a soft-touch cover in butter yellow.</p>",
        shortDescription:
            "A4 layflat sketchbook, 128 pages of 120 gsm warm-white paper.",
        images: [
            image(
                "sketch-pack",
                "A butter-yellow layflat sketchbook and pencils",
            ),
            image("sketch-action", "Hands drawing in a layflat sketchbook"),
        ],
        hoverImage: image(
            "sketch-action",
            "Hands drawing in a layflat sketchbook",
        ),
        prices: makePrice(125000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [sketch],
        stockQuantity: 35,
        featured: true,
        isNew: true,
        rating: 4.8,
        reviewCount: 67,
        attributes: { medium: "Mixed Media" },
    },
    {
        id: 112,
        name: "Graphite & Ink Sketch Set",
        slug: "graphite-and-ink-sketch-set",
        type: "simple",
        description:
            "<p>A compact drawing set with six graphite pencils (2H to 6B), a fineliner, a brush pen, a kneaded eraser and a sharpener. Everything lives in a slim tin that fits in a tote bag.</p><p>Good for quick café sketches, travel journals and the kind of drawing you do while waiting for chai.</p>",
        shortDescription:
            "Six graphite pencils, fineliner, brush pen, eraser and sharpener in a tin.",
        images: [
            image(
                "sketch-pack",
                "Graphite pencils and ink pens in a sketch set",
            ),
            image("sketch-action", "A hand sketching with graphite and ink"),
        ],
        hoverImage: image(
            "sketch-action",
            "A hand sketching with graphite and ink",
        ),
        prices: makePrice(145000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [sketch],
        stockQuantity: 32,
        rating: 4.7,
        reviewCount: 49,
        attributes: { medium: "Graphite" },
    },
    {
        id: 113,
        name: "Kids Craft Box",
        slug: "kids-craft-box",
        type: "simple",
        description:
            "<p>A cheerful box of supplies for ages 5 and up: pom poms, googly eyes, coloured paper, glue sticks, safe scissors, pipe cleaners, beads and a stack of project cards.</p><p>Enough for at least six afternoons of making, plus a few very good cardboard inventions.</p>",
        shortDescription:
            "A ready-to-go craft box for ages 5+, with supplies and project cards.",
        images: [
            image(
                "kids-pack",
                "A kids craft box filled with pom poms and paper",
            ),
            image("kids-action", "Children cutting colourful paper shapes"),
        ],
        hoverImage: image(
            "kids-action",
            "Children cutting colourful paper shapes",
        ),
        prices: makePrice(265000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [kids],
        stockQuantity: 20,
        featured: true,
        rating: 4.9,
        reviewCount: 58,
        badge: "Weekend Workshop",
        attributes: { age: "Ages 6–9" },
    },
    {
        id: 114,
        name: "Crochet Starter Kit",
        slug: "crochet-starter-kit",
        type: "simple",
        description:
            "<p>Everything you need to learn crochet: a 6 mm hook, two skeins of chunky cotton, a tapestry needle, stitch markers and an illustrated guide to the basic stitches.</p><p>Start with a simple coaster, then make a plant hanger, then accidentally a whole blanket.</p>",
        shortDescription:
            "Hook, two cotton skeins, markers and a beginner crochet guide.",
        images: [
            image("diy-pack", "A crochet starter kit with yarn and a hook"),
            image("diy-action", "Hands crocheting with a wooden hook"),
        ],
        hoverImage: image("diy-action", "Hands crocheting with a wooden hook"),
        prices: makePrice(275000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [diy, stitch],
        stockQuantity: 15,
        featured: true,
        rating: 4.8,
        reviewCount: 41,
        badge: "Beginner Friendly",
        attributes: {
            craft_type: "Crochet",
            material: "Cotton",
            skill: "Beginner",
        },
    },
    {
        id: 115,
        name: "Paint & Sip at Home Kit",
        slug: "paint-and-sip-at-home-kit",
        type: "simple",
        description:
            "<p>Two canvases, six acrylic colours, two brushes, a palette and a step-by-step guide to painting a Nairobi sunset. Made for a good playlist, a cold drink and absolutely no pressure to be good at it.</p><p>Order one for a date night, a flatmate evening or a solo Sunday.</p>",
        shortDescription:
            "A two-person paint night in a box, with canvases and a sunset guide.",
        images: [
            image(
                "bundle-pack",
                "A paint and sip kit with canvases and paints",
            ),
            image("bundle-action", "Friends painting together at a table"),
        ],
        hoverImage: image(
            "bundle-action",
            "Friends painting together at a table",
        ),
        prices: makePrice(345000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [diy, paint],
        stockQuantity: 12,
        featured: true,
        rating: 4.9,
        reviewCount: 36,
        badge: "Village Market Fave",
        attributes: { craft_type: "Painting", finish: "Gloss", size: "6-Set" },
    },
    {
        id: 116,
        name: "The Full Art Stash Bundle",
        slug: "the-full-art-stash-bundle",
        type: "simple",
        description:
            "<p>Our biggest starter bundle: acrylic paint, a brush set, a canvas trio, a sketchbook, graphite pencils and a fineliner. It is the “I want to make things” box, with a little bit of everything.</p><p>Save 15% compared with buying the pieces separately. Comes packed in a reusable cotton tote.</p>",
        shortDescription:
            "Paints, brushes, canvases, sketchbook and drawing tools in one bundle.",
        images: [
            image(
                "bundle-pack",
                "A large bundle of art supplies in a cotton tote",
            ),
            image(
                "bundle-action",
                "A flatlay of paints, brushes and sketchbooks",
            ),
        ],
        hoverImage: image(
            "bundle-action",
            "A flatlay of paints, brushes and sketchbooks",
        ),
        prices: makePrice(890000, 1050000, 890000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [bundles],
        stockQuantity: 8,
        featured: true,
        rating: 5,
        reviewCount: 22,
        badge: "Best Value",
        attributes: { bundle_type: "Starter Stash" },
    },
    {
        id: 117,
        name: "Weekend Workshop Kit",
        slug: "weekend-workshop-kit",
        type: "simple",
        description:
            "<p>A curated kit for a making weekend: air-dry clay, a pottery tool, a mini embroidery hoop, threads, a candle and a playlist card. Everything is packed into a kraft box with a handwritten project list.</p><p>Choose it as a gift, or keep it for the next long weekend.</p>",
        shortDescription:
            "A curated clay, embroidery and slow-craft kit for a making weekend.",
        images: [
            image("bundle-pack", "A weekend workshop kit in a kraft gift box"),
            image(
                "bundle-action",
                "A flatlay of clay, embroidery and craft supplies",
            ),
        ],
        hoverImage: image(
            "bundle-action",
            "A flatlay of clay, embroidery and craft supplies",
        ),
        prices: makePrice(495000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [bundles, diy],
        stockQuantity: 10,
        isNew: true,
        rating: 4.8,
        reviewCount: 19,
        attributes: { bundle_type: "Workshop Kit", craft_type: "Pottery" },
    },
    {
        id: 118,
        name: "Kids Rainy Day Bundle",
        slug: "kids-rainy-day-bundle",
        type: "simple",
        description:
            "<p>Three projects in one box: a pom-pom garland, a cardboard puppet theatre and a set of air-dry clay animals. Includes all the supplies, safe tools and a very helpful grown-up guide.</p><p>Best for ages 5–10, or any grown-up who needs an afternoon off.</p>",
        shortDescription:
            "Three rainy-day projects for ages 5–10, with supplies and guide.",
        images: [
            image("kids-pack", "A kids rainy day bundle with craft projects"),
            image("kids-action", "Children making a colourful craft project"),
        ],
        hoverImage: image(
            "kids-action",
            "Children making a colourful craft project",
        ),
        prices: makePrice(395000),
        isInStock: true,
        isPurchasable: true,
        hasOptions: false,
        categories: [kids, bundles],
        stockQuantity: 14,
        rating: 4.9,
        reviewCount: 27,
        attributes: { age: "Ages 6–9", bundle_type: "Gift Box" },
    },
];

export const demoWorkshops: Workshop[] = [
    {
        id: 201,
        slug: "free-sunday-crochet-club",
        title: "Free Sunday Crochet Club",
        excerpt:
            "Bring your hook, your current project and your questions. We will put the kettle on.",
        description:
            "<p>A free, friendly meetup for crocheters of every level. Bring your own project or start a simple coaster with the studio yarn. We have hooks, spare yarn and far too many opinions about the best chai nearby.</p>",
        date: "2026-11-08T10:00:00+03:00",
        time: "10:00–12:00",
        duration: "2 hours",
        price: makePrice(0),
        isFree: true,
        skill: "All levels",
        location: "Village Market, Nairobi",
        capacity: 20,
        seatsLeft: 12,
        kind: "meetup",
        image: image("stitch-action", "Hands crocheting at a Sunday meetup"),
    },
    {
        id: 202,
        slug: "paint-and-sip-nairobi-sunset",
        title: "Paint & Sip: Nairobi Sunset",
        excerpt:
            "A guided canvas night with bright colours, good music and zero pressure.",
        description:
            "<p>We will paint a loose, glowing Nairobi sunset on a 30 × 30 cm canvas. All supplies are included, and the step-by-step guidance means you can arrive with no experience at all. Bring your own drink; we will bring the paint and the playlist.</p>",
        date: "2026-11-14T18:00:00+03:00",
        time: "18:00–20:30",
        duration: "2.5 hours",
        price: makePrice(350000),
        isFree: false,
        skill: "Zero experience needed",
        location: "Village Market, Nairobi",
        capacity: 16,
        seatsLeft: 6,
        kind: "workshop",
        image: image("paint-action", "A bright sunset painting in progress"),
        wooProductId: 501,
    },
    {
        id: 203,
        slug: "kids-craft-hour-paper-and-pom-poms",
        title: "Kids Craft Hour: Paper & Pom Poms",
        excerpt:
            "A happy, messy hour of cutting, gluing and making for ages 5–10.",
        description:
            "<p>Small makers will build a pom-pom garland and a paper puppet to take home. All materials and safe tools are included, and grown-ups are welcome to stay for a cup of tea or join in.</p>",
        date: "2026-11-21T10:00:00+03:00",
        time: "10:00–11:30",
        duration: "1.5 hours",
        price: makePrice(150000),
        isFree: false,
        skill: "Ages 5–10",
        location: "Village Market, Nairobi",
        capacity: 18,
        seatsLeft: 9,
        kind: "workshop",
        image: image("kids-action", "Children making paper and pom-pom crafts"),
        wooProductId: 502,
    },
    {
        id: 204,
        slug: "beginner-embroidery-circle",
        title: "Beginner Embroidery Circle",
        excerpt:
            "Learn five simple stitches and leave with a finished floral hoop.",
        description:
            "<p>A slow, satisfying introduction to hand embroidery. We will cover transferring a pattern, five beginner stitches and finishing a hoop. All materials are included, and you will go home with a completed piece.</p>",
        date: "2026-11-28T14:00:00+03:00",
        time: "14:00–16:30",
        duration: "2.5 hours",
        price: makePrice(280000),
        isFree: false,
        skill: "Beginner friendly",
        location: "Village Market, Nairobi",
        capacity: 14,
        seatsLeft: 8,
        kind: "workshop",
        image: image("stitch-action", "A floral embroidery hoop in progress"),
        wooProductId: 503,
    },
    {
        id: 205,
        slug: "free-friday-sketch-jam",
        title: "Free Friday Sketch Jam",
        excerpt:
            "An after-work drawing session with prompts, pencils and no judgement.",
        description:
            "<p>Drop in after work for a loose, playful sketch session. We will set a few prompts, put on a good playlist and draw for an hour. Bring a sketchbook if you have one; we have paper and pencils to share.</p>",
        date: "2026-12-04T17:30:00+03:00",
        time: "17:30–19:00",
        duration: "1.5 hours",
        price: makePrice(0),
        isFree: true,
        skill: "All levels",
        location: "Village Market, Nairobi",
        capacity: 24,
        seatsLeft: 18,
        kind: "meetup",
        image: image(
            "sketch-action",
            "People sketching together at a long table",
        ),
    },
];

export const demoVibes: Vibe[] = [
    {
        slug: "paint",
        title: "I Want to Paint",
        description:
            "Acrylics, watercolour, brushes and canvas for your next big idea.",
        href: "/shop/?category=paint",
        image: image("paint-action", "Hands painting on a canvas"),
        accent: "#FFE3DB",
    },
    {
        slug: "stitch-sew",
        title: "I Want to Knit & Sew",
        description:
            "Fabric, yarn, thread and the tools that make a project come together.",
        href: "/shop/?category=stitch-sew",
        image: image("stitch-action", "Hands sewing colourful fabric"),
        accent: "#F4EFFF",
    },
    {
        slug: "kids",
        title: "I Need Kids Projects",
        description:
            "Safe, colourful supplies for small hands and very big imaginations.",
        href: "/shop/?category=kids",
        image: image("kids-action", "Children making a colourful craft"),
        accent: "#EDF8F5",
    },
    {
        slug: "restock",
        title: "I’m Restocking My Art Stash",
        description:
            "Bundles and starter sets that cover the whole creative table.",
        href: "/shop/?category=bundles",
        image: image("bundle-action", "A flatlay of art and craft supplies"),
        accent: "#FFF1C7",
    },
];

export const demoUgc: UgcPost[] = [
    {
        id: 1,
        handle: "@wanjiru.makes",
        caption: "First amigurumi bunny, zero regrets.",
        image: {
            src: "https://placehold.co/700x700/FFE3DB/211D19?text=%40wanjiru.makes",
            alt: "A handmade crochet bunny on a wooden table",
        },
    },
    {
        id: 2,
        handle: "@kamau.paints",
        caption: "Sunday watercolour club, Village Market.",
        image: {
            src: "https://placehold.co/700x700/F4EFFF/211D19?text=%40kamau.paints",
            alt: "A watercolour painting of Nairobi rooftops in progress",
        },
    },
    {
        id: 3,
        handle: "@littlehands.studio",
        caption: "Kids' clay afternoon, very serious business.",
        image: {
            src: "https://placehold.co/700x700/EDF8F5/211D19?text=%40littlehands.studio",
            alt: "Children shaping air-dry clay bowls",
        },
    },
    {
        id: 4,
        handle: "@atieno.stitches",
        caption: "Finished the chunky scarf before the rains.",
        image: {
            src: "https://placehold.co/700x700/FFF1C7/211D19?text=%40atieno.stitches",
            alt: "A chunky knit scarf in warm tones",
        },
    },
    {
        id: 5,
        handle: "@craft.dad.ke",
        caption: "DIY kit turned into a weekend project.",
        image: {
            src: "https://placehold.co/700x700/FFF9EB/211D19?text=%40craft.dad.ke",
            alt: "A finished DIY birdhouse kit on a balcony table",
        },
    },
    {
        id: 6,
        handle: "@mwende.sketches",
        caption: "Sketchbook spread from the Sunday workshop.",
        image: {
            src: "https://placehold.co/700x700/FFE3DB/211D19?text=%40mwende.sketches",
            alt: "An open sketchbook with pencil studies of plants",
        },
    },
];

export const demoTestimonials: Testimonial[] = [
    {
        id: 301,
        quote: "I came for one paint set and left with a whole new Sunday ritual. The team helped me choose everything without making me feel like a beginner.",
        name: "Wanjiku M.",
        detail: "Kilimani · paints & workshops",
        image: image("paint-action", "A customer painting at home"),
    },
    {
        id: 302,
        quote: "The Sunday Crochet Club is the friendliest hour of my week. I have made three blankets and four very good friends.",
        name: "Achieng O.",
        detail: "Westlands · crochet club",
        image: image("stitch-action", "A crochet project in progress"),
    },
    {
        id: 303,
        quote: "My kids made a mess, made friends and made a puppet. Worth every shilling — and the shop packed everything up for us.",
        name: "Priya S.",
        detail: "Runda · kids craft hour",
        image: image("kids-action", "A child making a paper craft"),
    },
];

export const demoPosts: Post[] = [
    {
        id: 1,
        slug: "choosing-your-first-paint-set",
        title: "How to choose your first paint set",
        excerpt:
            "Acrylic or watercolour? Tubes or pans? A simple guide to buying paint without buying everything at once.",
        date: "2026-10-10T08:00:00.000Z",
        image: image("paint-action", "A colourful painting in progress"),
        categories: ["Paint", "Beginner"],
        content:
            "<p>The best first paint set is the one you will actually use. If you like the idea of sitting down with a cup of tea and a small palette, start with watercolour. If you want bold colour, texture and the freedom to paint over mistakes, start with acrylic.</p><h2>Start with fewer colours</h2><p>A small set of good colours will take you further than a giant set of muddy ones. Look for a warm and cool version of each primary, plus a good white and a dark. You can mix almost everything else.</p><h2>Tubes or pans?</h2><p>Pans are tidy, portable and perfect for sketchbooks. Tubes give you more paint for larger work and are easier to mix in quantity. If you are unsure, start with pans and add a few tubes later.</p><h2>What to buy with it</h2><ul><li>A brush that feels comfortable in your hand</li><li>Paper that can take the amount of water you use</li><li>A palette or a clean ceramic plate</li><li>A rag you do not mind ruining</li></ul><p>Come into the shop and we will happily let you try a few options before you commit.</p>",
    },
    {
        id: 2,
        slug: "a-saturday-at-the-village-market-studio",
        title: "A Saturday at the Village Market studio",
        excerpt:
            "Crochet hooks, paint water, small makers and the very good chai next door.",
        date: "2026-09-22T08:00:00.000Z",
        image: image(
            "stitch-action",
            "A busy studio table with craft supplies",
        ),
        categories: ["Studio", "Community"],
        content:
            "<p>Saturday starts early at the shop. We open the doors, put the kettle on and move the big table into the middle of the room. By ten, there is usually someone crocheting in the corner and a small person asking very seriously whether they can use the glitter glue.</p><h2>The big table</h2><p>We keep the table free for anyone who wants to sit and make. You do not need to book a workshop or buy anything. Bring your project, borrow a chair and stay for a while.</p><p>If you are new, ask us for a demo. We will show you how to hold the hook, how to load a brush or how to stop your clay from drying out before you finish.</p><h2>Come and see</h2><p>We are at Village Market, Nairobi. Look for the bright shop with the paint-splattered window and the very large jar of buttons.</p>",
    },
    {
        id: 3,
        slug: "five-rainy-day-projects-for-kids",
        title: "Five rainy-day projects for kids",
        excerpt:
            "Low-stress, high-colour ideas for a Nairobi afternoon when the sky opens.",
        date: "2026-09-05T08:00:00.000Z",
        image: image("kids-action", "Children making colourful paper crafts"),
        categories: ["Kids", "DIY"],
        content:
            "<p>A rainy afternoon is not a problem if there is a box of paper, glue and pom poms within reach. Here are five projects we come back to again and again.</p><h2>1. A pom-pom garland</h2><p>Thread pom poms onto a long piece of yarn and hang it across a window. Good for colour, fine motor skills and using up the odd pom pom at the bottom of the box.</p><h2>2. A cardboard puppet theatre</h2><p>Cut a window in a cereal box, paint the frame and make two paper puppets. The performance is usually shorter than the making, which is exactly right.</p><h2>3. Clay animals</h2><p>Air-dry clay, a few tools and a table covered in newspaper. Let them dry overnight, then paint the next day.</p><h2>4. A paper collage city</h2><p>Cut buildings, roads and trees from old magazines and coloured paper. Stick it all down on a big sheet and add stickers for traffic lights.</p><h2>5. A nature sketchbook</h2><p>Give each child a small book and a pencil. Go for a walk, collect three leaves and draw them when you get home.</p>",
    },
];

export const demoPages: Record<string, PageContent> = {
    about: {
        slug: "about",
        title: "A happy little art shop in Nairobi",
        content:
            "<p>Craft &amp; Colours is an art, craft and haberdashery shop at Village Market, Nairobi. We stock the supplies we actually use, run workshops for every level, and keep a big table free for anyone who wants to make something.</p><p>We opened because we wanted a place in Nairobi where you could buy one good brush, ask a question without feeling silly, and find a workshop that did not assume you already knew everything.</p><h2>What you will find here</h2><p>Paint, stitch and sew, clay, sketch, kids’ projects and DIY kits. Everything is chosen by our team, and we are always happy to help you put a project together.</p><blockquote>You do not need to be good at it. You just need to start.</blockquote><p>Come in, touch the paper, ask us what the difference is between two brushes, and stay for a while. We are at Village Market, and the kettle is usually on.</p>",
    },
    contact: {
        slug: "contact",
        title: "Come say hello at Village Market",
        content:
            "<p>Questions about a product, a workshop or a custom order? Send us a note, call in, or message us on WhatsApp. We are a small team and we actually read every message.</p>",
    },
    studio: {
        slug: "studio",
        title: "The studio at Village Market",
        content:
            "<p>The Craft &amp; Colours studio is the big, bright room behind the shop. It is where we run workshops, host free meetups and occasionally cover every surface in paint, clay or glitter.</p><p>You can book a class, join a free club, or simply sit at the big table with your own project. Come as you are. No experience required.</p>",
    },
};
