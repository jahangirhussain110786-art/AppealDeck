# Dex in Blender

Dex's body, glove and boot are modelled here, then exported as `public/dex/dex_parts.glb`, which the website
loads (see `src/components/dex3d/dexAssets.ts`). Everything that moves (arms, cape, face, paper wobble,
collisions) is still driven by the website's own code.

## Rebuild

1. Start the dev server (`npm run dev`) and draw the face textures:
   `node tools/blender/make_faces.mjs tools/blender/out/faces`
2. Build, render and export (Blender 5.x; the portable build on the Desktop works):

```bash
blender --background --factory-startup --python tools/blender/build_dex.py -- tools/blender/out tools/blender/out/faces static
```

Stages: `export` (parts only, no renders), `static` (renders three views, exports and saves `dex.blend`).

3. Copy `tools/blender/out/dex_parts.glb` to `public/dex/dex_parts.glb`.

`out/` holds renders, faces and the `.blend`; it is not meant to be committed.

## Files

- `dexlib.py` helpers (materials, pillow slab, three.js to Blender coordinates)
- `limbs.py` glove, boot and arm shapes (soft blended metaballs)
- `build_dex.py` the whole build, ambient-occlusion baking and export
- `make_faces.mjs` draws the face with the website's own drawing code
