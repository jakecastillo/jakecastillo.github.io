import * as THREE from "three";

// These are the exact half-float CubeUV texels produced by our studio recipe,
// compressed losslessly. No tone mapping or 8-bit image conversion is applied.
export async function loadStudioEnvironment(lightweight, signal) {
  const size = lightweight ? 64 : 256;
  const response = await fetch(`/environment/studio-r182-${size}.bin.gz`, {
    signal,
  });
  if (!response.ok) throw new Error("Could not load the studio environment");
  const buffer = await new Response(
    response.body.pipeThrough(new DecompressionStream("gzip")),
  ).arrayBuffer();
  signal?.throwIfAborted();
  const width = 3 * Math.max(size, 16 * 7);
  const height = 4 * size;
  if (buffer.byteLength !== width * height * 8)
    throw new Error("Invalid studio environment size");
  const texture = new THREE.DataTexture(
    new Uint16Array(buffer),
    width,
    height,
    THREE.RGBAFormat,
    THREE.HalfFloatType,
  );
  texture.mapping = THREE.CubeUVReflectionMapping;
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
