import { getImage, inferRemoteSize } from "astro:assets";
import type { ProductImage } from "./types";

// CMS uploads are served exactly as they were uploaded, from a slow host. These
// resize them to WebP at build time so pages load the much smaller copies from
// _astro/. Allowed hosts are listed under image.domains in astro.config.mjs.

export interface OptimizedImage {
    src: string;
    srcset?: string;
    width?: number;
    height?: number;
}

const cmsHosts = new Set(
    [import.meta.env.WP_URL, import.meta.env.PUBLIC_WC_STORE_URL].flatMap(
        (url) => (url && URL.canParse(url) ? [new URL(url).hostname] : []),
    ),
);

// Pages share images, so only read each one's size once.
const remoteSizes = new Map<string, ReturnType<typeof inferRemoteSize>>();

function isCmsImage(src: string): boolean {
    return URL.canParse(src) && cmsHosts.has(new URL(src).hostname);
}

function remoteSize(src: string): ReturnType<typeof inferRemoteSize> {
    let size = remoteSizes.get(src);
    if (!size) {
        size = inferRemoteSize(src);
        remoteSizes.set(src, size);
    }
    return size;
}

/** Falls back to the original file so one bad image can't break a page. */
export async function optimizeCmsImage(
    src: string,
    widths: number[],
): Promise<OptimizedImage> {
    if (!isCmsImage(src)) return { src };

    try {
        const size = await remoteSize(src);
        // SVGs are already small, and resizing would flatten an animated GIF.
        if (size.format === "svg" || size.format === "gif") return { src };

        // Never enlarge: keep only the widths the original can fill.
        const usable = widths.filter((width) => width < size.width);
        const targets = usable.length > 0 ? usable : [size.width];
        const width = Math.max(...targets);
        const height = Math.round((width * size.height) / size.width);

        const image = await getImage({
            src,
            width,
            height,
            widths: targets,
            format: "webp",
        });

        return { src: image.src, srcset: image.srcSet.attribute, width, height };
    } catch (error) {
        console.warn(`Could not optimize CMS image ${src}; using the original.`, error);
        return { src };
    }
}

/** For React islands, which can't use the CmsImage component. */
export async function optimizeProductImages(
    images: ProductImage[],
    widths: number[],
): Promise<ProductImage[]> {
    return Promise.all(
        images.map(async (image) => {
            const { src, srcset } = await optimizeCmsImage(image.src, widths);
            return { ...image, src, srcset };
        }),
    );
}
