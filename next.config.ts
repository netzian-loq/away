import type { NextConfig } from "next";

/**
 * Folders in public/ whose files only change when an image is replaced.
 * Without a header they are served with max-age=0 and revalidated on every
 * view. Thirty days, but not `immutable`: the filenames are not hashed, so a
 * replaced screenshot has to be able to reach returning visitors eventually.
 */
const CACHED_ASSET_DIRS = ["/icons", "/overtuner", "/uefi-kompile", "/oneprodige"];

const nextConfig: NextConfig = {
  async headers() {
    return CACHED_ASSET_DIRS.map((dir) => ({
      // `:path+`, not `:path*`: the star also matches the bare folder path,
      // and /overtuner, /uefi-kompile and /oneprodige are pages, whose HTML
      // must not be cached for a month.
      source: `${dir}/:path+`,
      headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }],
    }));
  },
};

export default nextConfig;
