import { useState } from 'react';
import type { ProductImage } from '../../lib/types';

interface Props {
  images: ProductImage[];
  name: string;
}

export default function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);
  const current = images[active];

  if (!current) {
    return (
      <div className="grid aspect-[4/5] place-items-center rounded-3xl bg-cream-200/60 text-sm text-ink-500">
        Image coming soon
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-3xl bg-cream-200/60">
        <img
          src={current.src}
          alt={current.alt || name}
          width={900}
          height={1125}
          className="aspect-[4/5] w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`overflow-hidden rounded-xl border-2 transition ${
                active === index
                  ? 'border-ink-900'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-pressed={active === index}
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
      )}
    </div>
  );
}
