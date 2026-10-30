import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductImage } from '../../lib/types';

interface Props {
  images: ProductImage[];
  name: string;
}

// Product page gallery. Images come from WooCommerce "Product image" +
// "Product gallery" (Store API `images[]`, main image first). With more than
// one image it becomes a carousel: swipe (CSS scroll-snap), arrows, dots,
// thumbnails and ←/→ keys all move the same track.
export default function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const count = images.length;

  // Keep `active` in step with the track however it was scrolled (swipe,
  // trackpad, buttons).
  useEffect(() => {
    const track = trackRef.current;
    if (!track || count < 2) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const index = Math.round(track.scrollLeft / track.clientWidth);
        setActive(Math.max(0, Math.min(count - 1, index)));
      });
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener('scroll', onScroll);
    };
  }, [count]);

  // Bring the active thumbnail into view when there are more than fit.
  useEffect(() => {
    const thumbs = thumbsRef.current;
    const thumb = thumbs?.children[active] as HTMLElement | undefined;
    if (!thumbs || !thumb) return;
    const left = thumb.offsetLeft - (thumbs.clientWidth - thumb.clientWidth) / 2;
    thumbs.scrollTo({ left, behavior: scrollBehavior() });
  }, [active]);

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const next = (index + count) % count;
    track.scrollTo({ left: next * track.clientWidth, behavior: scrollBehavior() });
    setActive(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(active - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(active + 1);
    }
  }

  if (count === 0) {
    return (
      <div className="grid aspect-[4/5] place-items-center rounded-3xl bg-cream-200/60 text-sm text-ink-500">
        Image coming soon
      </div>
    );
  }

  if (count === 1) {
    return (
      <div className="overflow-hidden rounded-3xl bg-cream-200/60">
        <img
          src={images[0].src}
          alt={images[0].alt || name}
          width={900}
          height={1125}
          className="aspect-[4/5] w-full object-cover"
        />
      </div>
    );
  }

  const arrowClass =
    'absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-cream-50/90 text-ink-900 shadow-sticker backdrop-blur transition duration-200 ease-bounce hover:scale-110 hover:bg-cream-50 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900';

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`${name} images`}
      onKeyDown={onKeyDown}
    >
      <div className="group relative">
        <div
          ref={trackRef}
          tabIndex={0}
          className="flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-3xl bg-cream-200/60 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-900 [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              aria-hidden={index !== active}
              className="w-full shrink-0 snap-center snap-always"
            >
              <img
                src={image.src}
                alt={image.alt || name}
                width={900}
                height={1125}
                loading={index === 0 ? 'eager' : 'lazy'}
                draggable={false}
                className="aspect-[4/5] w-full select-none object-cover"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(active - 1)}
          aria-label="Previous image"
          className={`${arrowClass} left-3`}
        >
          <ChevronLeft size={20} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          aria-label="Next image"
          className={`${arrowClass} right-3`}
        >
          <ChevronRight size={20} strokeWidth={2.4} aria-hidden="true" />
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5">
          {images.map((image, index) => (
            <span
              key={`${image.src}-dot-${index}`}
              className={`h-2 rounded-full transition-all duration-300 ease-bounce ${
                index === active ? 'w-6 bg-ink-900' : 'w-2 bg-ink-900/30'
              }`}
            />
          ))}
        </div>

        <p
          className="absolute right-4 top-4 rounded-full bg-ink-900/75 px-2.5 py-1 text-[0.68rem] font-bold tracking-wide text-cream-50"
          aria-live="polite"
        >
          {active + 1} / {count}
        </p>
      </div>

      <div
        ref={thumbsRef}
        className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]"
      >
        {images.map((image, index) => (
          <button
            key={`${image.src}-thumb-${index}`}
            type="button"
            onClick={() => goTo(index)}
            className={`w-[calc((100%-2.25rem)/4)] shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition ${
              active === index
                ? 'border-ink-900'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            aria-label={`View image ${index + 1} of ${count}`}
            aria-current={active === index ? 'true' : undefined}
          >
            <img
              src={image.thumbnail || image.src}
              alt=""
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          </button>
        ))}
      </div>
    </section>
  );
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
}
