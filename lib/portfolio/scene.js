import * as THREE from "three";
import { createSystemEffects } from "./scene-effects.js";

export function createSystemScene(container, onContextLoss) {
  const lightweight = matchMedia(
    "(max-width: 560px), (pointer: coarse) and (max-width: 1024px)",
  ).matches;
  const segments = (full) =>
    lightweight ? Math.max(6, Math.round(full / 2)) : full;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !lightweight,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, lightweight ? 1 : 1.5));
  renderer.setClearColor(0x07100e, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.transmissionResolutionScale = 0.5;
  const canvas = renderer.domElement;
  canvas.className = "webgl-system";
  canvas.dataset.quality = lightweight ? "mobile" : "full";
  canvas.setAttribute("aria-hidden", "true");
  container.append(canvas);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07100e, 0.018);
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);
  const lights = [
    new THREE.HemisphereLight(0xe5ffd2, 0x0a1c17, 2.3),
    new THREE.DirectionalLight(0xebffce, 5),
    new THREE.DirectionalLight(0x75cfa9, 3),
  ];
  lights[1].position.set(-4, 10, 6);
  lights[2].position.set(7, 3, -5);
  lights.forEach((l) => scene.add(l));
  const pointLight = new THREE.PointLight(0xd0ff77, 28, 16, 2);
  pointLight.position.set(0, 3, 1);
  scene.add(pointLight);
  // A procedural studio environment provides reflections without external HDR assets.
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x23332a);
  const envGeometries = [],
    envMaterials = [];
  [
    [0, 8, 0, 14, 4],
    [-8, 1, 4, 5, 12],
    [7, 3, -4, 4, 9],
  ].forEach(([x, y, z, w, h]) => {
    const g = new THREE.PlaneGeometry(w, h);
    const m = new THREE.MeshBasicMaterial({
      color: 0xe7ffd0,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(g, m);
    plane.position.set(x, y, z);
    plane.lookAt(0, 0, 0);
    envScene.add(plane);
    envGeometries.push(g);
    envMaterials.push(m);
  });
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(envScene, 0.025, 0.1, 100, {
    size: lightweight ? 64 : 256,
  });
  scene.environment = environment.texture;
  pmrem.dispose();
  envGeometries.forEach((g) => g.dispose());
  envMaterials.forEach((m) => m.dispose());
  const layers = [],
    allTextures = [];
  const pale = new THREE.Color(0xd5f5a2);
  const lineGeometry = new THREE.BoxGeometry(7.8, 0.14, 4.9);
  const slabGeometry = new THREE.BoxGeometry(7.8, 0.12, 4.9);
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const smooth = (n) => {
    n = clamp(n);
    return n * n * (3 - 2 * n);
  };
  const between = (a, b, p) => smooth((p - a) / (b - a));
  const sample = (values, p) => {
    const i = Math.min(3, Math.floor(p * 4));
    return THREE.MathUtils.lerp(values[i], values[i + 1], smooth(p * 4 - i));
  };
  function wire(points, material, parent) {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map(([x, z]) => new THREE.Vector3(x, 0.105, z)),
    );
    const line = new THREE.Line(geometry, material);
    parent.add(line);
    return line;
  }
  function node(x, z, r, material, parent) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, 0.07, segments(24)),
      material,
    );
    mesh.position.set(x, 0.16, z);
    parent.add(mesh);
    return mesh;
  }
  function ring(x, z, r, material, parent) {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.012, 5, segments(72)),
      material,
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.15, z);
    parent.add(mesh);
    return mesh;
  }
  function makeLabel(text, parent) {
    const surface = document.createElement("canvas");
    surface.width = 1024;
    surface.height = 96;
    const ctx = surface.getContext("2d");
    ctx.clearRect(0, 0, 1024, 96);
    ctx.font = "28px monospace";
    ctx.fillStyle = "#e0f6b9";
    ctx.fillText(text, 16, 53);
    const texture = new THREE.CanvasTexture(surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    allTextures.push(texture);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(6.9, 0.65), material);
    label.rotation.x = -Math.PI / 2;
    label.position.set(0, 0.16, -2.04);
    parent.add(label);
  }
  [
    "00 / THE SURFACE",
    "01 / HUMAN CONTEXT",
    "02 / SYSTEM ARCHITECTURE",
    "03 / DELIVERY & TRUST",
  ].forEach((label, index) => {
    const group = new THREE.Group();
    root.add(group);
    const slabMaterial = new THREE.MeshPhysicalMaterial({
      color: index === 0 ? 0x263229 : 0x10221c,
      roughness: 0.24,
      metalness: 0.7,
      clearcoat: lightweight ? 0 : 1,
      clearcoatRoughness: 0.12,
      transmission: lightweight ? 0 : 0.18,
      thickness: 0.18,
      transparent: true,
      opacity: 0.9,
      envMapIntensity: 1.5,
    });
    const slab = new THREE.Mesh(slabGeometry, slabMaterial);
    group.add(slab);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: pale,
      transparent: true,
      opacity: 0.8,
    });
    group.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(lineGeometry),
        edgeMaterial,
      ),
    );
    const traceMaterial = new THREE.LineBasicMaterial({
      color: pale,
      transparent: true,
      opacity: 0.85,
    });
    const brightMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9fca8,
      emissive: 0xa7e858,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.3,
      transparent: true,
    });
    makeLabel(label, group);
    // Micro-grid and four machined corner pins give each layer physical scale.
    const gridPoints = [];
    for (let x = -3.5; x <= 3.5; x += 0.5)
      gridPoints.push(
        new THREE.Vector3(x, 0.105, -1.55),
        new THREE.Vector3(x, 0.105, 2.05),
      );
    for (let z = -1.5; z <= 2; z += 0.5)
      gridPoints.push(
        new THREE.Vector3(-3.5, 0.105, z),
        new THREE.Vector3(3.5, 0.105, z),
      );
    group.add(
      new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(gridPoints),
        new THREE.LineBasicMaterial({
          color: 0x78a873,
          transparent: true,
          opacity: 0.12,
        }),
      ),
    );
    [
      [-3.6, -2.15],
      [-3.6, 2.15],
      [3.6, -2.15],
      [3.6, 2.15],
    ].forEach(([x, z]) => node(x, z, 0.055, brightMaterial, group));
    if (index === 0) {
      wire(
        [
          [-2.9, -1.35],
          [2.9, -1.35],
          [2.9, 1.8],
          [-2.9, 1.8],
          [-2.9, -1.35],
        ],
        traceMaterial,
        group,
      );
      wire(
        [
          [-2.9, -0.55],
          [2.9, -0.55],
        ],
        traceMaterial,
        group,
      );
      for (let i = 0; i < 3; i++) {
        const x = -1.85 + i * 1.85;
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.09, 1.5),
          new THREE.MeshPhysicalMaterial({
            color: 0x91b96b,
            roughness: 0.28,
            metalness: 0.5,
            transparent: true,
            opacity: 0.55,
          }),
        );
        box.position.set(x, 0.15, 0.58);
        group.add(box);
        node(-2.5 + i * 0.28, -0.98, 0.045, brightMaterial, group);
      }
    } else if (index === 1) {
      ring(0, 0.2, 1.1, brightMaterial, group);
      ring(
        0,
        0.2,
        1.7,
        new THREE.MeshBasicMaterial({
          color: 0x8fb563,
          transparent: true,
          opacity: 0.5,
        }),
        group,
      );
      [
        [-2.4, -0.8],
        [2.4, -0.8],
        [-2.4, 1.3],
        [2.4, 1.3],
      ].forEach(([x, z]) => {
        wire(
          [
            [x, z],
            [0, 0.2],
          ],
          traceMaterial,
          group,
        );
        node(x, z, 0.16, brightMaterial, group);
        ring(x, z, 0.31, brightMaterial, group);
      });
      const sphere = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.42, 2),
        new THREE.MeshPhysicalMaterial({
          color: 0xc7ed9c,
          metalness: 0.65,
          roughness: 0.17,
          emissive: 0x799a39,
          emissiveIntensity: 0.4,
        }),
      );
      sphere.position.set(0, 0.46, 0.2);
      group.add(sphere);
    } else if (index === 2) {
      const points = [
        [-2.7, -0.8],
        [-2.7, 1.25],
        [0, 0.22],
        [2.7, -0.8],
        [2.7, 1.25],
      ];
      wire(
        [
          [-2.7, -0.8],
          [-0.8, -0.8],
          [-0.8, 1.25],
          [2.7, 1.25],
        ],
        traceMaterial,
        group,
      );
      wire(
        [
          [-2.7, 1.25],
          [-0.8, 1.25],
          [-0.8, -0.8],
          [2.7, -0.8],
        ],
        traceMaterial,
        group,
      );
      points.forEach(([x, z]) => {
        wire(
          [
            [x - 0.42, z - 0.3],
            [x + 0.42, z - 0.3],
            [x + 0.42, z + 0.3],
            [x - 0.42, z + 0.3],
            [x - 0.42, z - 0.3],
          ],
          traceMaterial,
          group,
        );
        node(x, z, 0.095, brightMaterial, group);
      });
    } else {
      const shield = [
        [-1.15, -0.85],
        [0, -1.35],
        [1.15, -0.85],
        [1.15, 0.5],
        [0.85, 1.1],
        [0, 1.75],
        [-0.85, 1.1],
        [-1.15, 0.5],
        [-1.15, -0.85],
      ];
      wire(shield, traceMaterial, group);
      wire(
        shield.map(([x, z]) => [x * 0.78, z * 0.78 + 0.05]),
        traceMaterial,
        group,
      );
      wire(
        [
          [-0.5, 0.2],
          [-0.13, 0.58],
          [0.59, -0.25],
        ],
        new THREE.LineBasicMaterial({ color: 0xe5ffb2 }),
        group,
      );
      ring(
        0,
        0.1,
        1.95,
        new THREE.MeshBasicMaterial({
          color: 0x91b970,
          transparent: true,
          opacity: 0.35,
        }),
        group,
      );
      node(-2.8, 0.2, 0.09, brightMaterial, group);
      node(2.8, 0.2, 0.09, brightMaterial, group);
      wire(
        [
          [-2.8, 0.2],
          [-1.8, 0.2],
        ],
        traceMaterial,
        group,
      );
      wire(
        [
          [1.8, 0.2],
          [2.8, 0.2],
        ],
        traceMaterial,
        group,
      );
    }
    layers.push({
      group,
      slabMaterial,
      edgeMaterial,
      traceMaterial,
      brightMaterial,
    });
  });
  const rods = [];
  [
    [-3.6, -2.15],
    [-3.6, 2.15],
    [3.6, -2.15],
    [3.6, 2.15],
  ].forEach(([x, z]) => {
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 1, 6),
      new THREE.MeshBasicMaterial({
        color: 0x94ce78,
        transparent: true,
        opacity: 0.2,
      }),
    );
    rod.position.set(x, 0, z);
    root.add(rod);
    rods.push(rod);
  });
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(5.6, 0.012, 6, segments(128)),
    new THREE.MeshBasicMaterial({
      color: 0x94c46b,
      transparent: true,
      opacity: 0.22,
    }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = -3.5;
  root.add(halo);
  const dustPositions = new Float32Array(120 * 3);
  for (let i = 0; i < (lightweight ? 40 : 120); i++) {
    dustPositions[i * 3] = (((i * 73) % 101) / 101) * 25 - 12.5;
    dustPositions[i * 3 + 1] = (((i * 47) % 103) / 103) * 20 - 10;
    dustPositions[i * 3 + 2] = (((i * 29) % 107) / 107) * 25 - 12.5;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(dustPositions, 3),
  );
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({
      color: 0xcfefa3,
      size: 0.025,
      transparent: true,
      opacity: 0.42,
      sizeAttenuation: true,
      depthWrite: false,
    }),
  );
  scene.add(dust);
  // A luminous gyroscope is the system's physical center. Every movement is scrubbed by scroll.
  const core = new THREE.Group();
  root.add(core);
  const ember = new THREE.Color(0xff9c54);
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffbd75,
    emissive: 0xff6629,
    emissiveIntensity: 1.5,
    metalness: 0.55,
    roughness: 0.15,
    clearcoat: lightweight ? 0 : 1,
  });
  const nucleus = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.72, 1),
    coreMaterial,
  );
  core.add(nucleus);
  const cage = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.1, 1)),
    new THREE.LineBasicMaterial({
      color: 0xffb981,
      transparent: true,
      opacity: 0.6,
    }),
  );
  core.add(cage);
  const gyros = [];
  for (let i = 0; i < 3; i++) {
    const gyro = new THREE.Group();
    core.add(gyro);
    const metal = new THREE.Mesh(
      new THREE.TorusGeometry(1.55 + i * 0.36, 0.023, 6, segments(144)),
      new THREE.MeshStandardMaterial({
        color: 0xd4ecc1,
        metalness: 0.85,
        roughness: 0.22,
        emissive: 0x466842,
        emissiveIntensity: 0.35,
      }),
    );
    gyro.add(metal);
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(
        1.55 + i * 0.36,
        0.038,
        6,
        segments(96),
        Math.PI * 1.15,
      ),
      new THREE.MeshBasicMaterial({ color: ember }),
    );
    gyro.add(arc);
    for (let j = 0; j < 4; j++) {
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.17, 0.07),
        new THREE.MeshBasicMaterial({ color: 0xffd6ac }),
      );
      const angle = (j * Math.PI) / 2;
      marker.position.set(
        Math.cos(angle) * (1.55 + i * 0.36),
        Math.sin(angle) * (1.55 + i * 0.36),
        0,
      );
      marker.rotation.z = angle;
      gyro.add(marker);
    }
    gyros.push(gyro);
  }
  const glowSurface = document.createElement("canvas");
  glowSurface.width = glowSurface.height = 128;
  const glowContext = glowSurface.getContext("2d"),
    gradient = glowContext.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,152,68,.6)");
  gradient.addColorStop(0.25, "rgba(255,105,35,.22)");
  gradient.addColorStop(1, "rgba(255,85,20,0)");
  glowContext.fillStyle = gradient;
  glowContext.fillRect(0, 0, 128, 128);
  const glowTexture = new THREE.CanvasTexture(glowSurface);
  allTextures.push(glowTexture);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xffb17e,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.scale.set(8, 8, 1);
  core.add(glow);
  const coreLight = new THREE.PointLight(0xff8d41, 24, 13, 2);
  core.add(coreLight);
  const gate = new THREE.Group();
  root.add(gate);
  const gateMaterial = new THREE.LineBasicMaterial({
    color: 0xb8d893,
    transparent: true,
    opacity: 0.18,
  });
  for (let i = 0; i < 3; i++) {
    const radius = 6.4 + i * 0.55,
      points = [];
    for (let j = 0; j <= 160; j++) {
      const a = (j / 160) * Math.PI * 2;
      points.push(
        new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0),
      );
    }
    gate.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        gateMaterial,
      ),
    );
  }
  const tickPoints = [];
  for (let i = 0; i < 80; i++) {
    const a = (i / 80) * Math.PI * 2,
      r = i % 5 === 0 ? 6.15 : 6.3;
    tickPoints.push(
      new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0),
      new THREE.Vector3(Math.cos(a) * 6.45, Math.sin(a) * 6.45, 0),
    );
  }
  gate.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(tickPoints),
      new THREE.LineBasicMaterial({
        color: 0xd9f0b2,
        transparent: true,
        opacity: 0.3,
      }),
    ),
  );
  // Keep the instrument rings behind even the fully peeled, rotated chips.
  gate.position.set(0, 0, -11);
  gate.rotation.y = 0.12;
  const chipBounds = new THREE.Box3(
    new THREE.Vector3(-4.08, -0.09, -2.63),
    new THREE.Vector3(4.08, 0.92, 2.63),
  );
  const transformedChipBounds = new THREE.Box3();
  const coreEnvelopeRadius = 2.38; // Includes the outer ring's tube and marker corners.
  const ringClearance = 0.38;
  const effects = createSystemEffects(THREE, {
    layers,
    core,
    root,
    lightweight,
  });
  // Shared materials are updated once, rather than traversing every mesh each frame.
  layers.forEach((layer) => {
    const materials = new Set();
    layer.group.traverse((object) => {
      if (object.material)
        (Array.isArray(object.material)
          ? object.material
          : [object.material]
        ).forEach((material) => materials.add(material));
    });
    layer.materials = [...materials].map((material) => ({
      material,
      opacity: material.opacity,
    }));
  });
  let lost = false,
    disposed = false;
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
    canvas.style.display = "none";
    onContextLoss();
    dispose();
  });
  function resize() {
    if (disposed) return;
    const r = container.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    camera.aspect = r.width / Math.max(r.height, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  function render(progress, still, pointer = { x: 0, y: 0 }) {
    if (lost || disposed) return;
    const p = still ? 0 : progress;
    const separation = sample([1.05, 2.0, 2.3, 1.7, 0.6], p);
    const reassemble = 1 - between(0.83, 1, p);
    root.rotation.y =
      sample([-0.28, -0.06, 0.24, 0.42, -0.35], p) +
      (still ? 0 : pointer.x * 0.13);
    let lowestChip = Infinity;
    layers.forEach((layer, i) => {
      const passed = between(0.06 + i * 0.195, 0.23 + i * 0.18, p) * reassemble;
      layer.group.position.set(
        passed * (i % 2 ? 2.8 : -2.8),
        (1.5 - i) * separation + passed * 8,
        passed * -2.5,
      );
      layer.group.rotation.z = passed * (i % 2 ? 0.3 : -0.3);
      layer.group.rotation.y = passed * 0.5;
      const opacity = 1 - passed;
      layer.group.visible = opacity > 0.015;
      if (layer.group.visible) {
        layer.group.updateMatrix();
        transformedChipBounds.copy(chipBounds).applyMatrix4(layer.group.matrix);
        lowestChip = Math.min(lowestChip, transformedChipBounds.min.y);
      }
      layer.materials.forEach(({ material, opacity: originalOpacity }) => {
        material.transparent = true;
        material.opacity = originalOpacity * opacity;
      });
      const highlighted = 1 - Math.min(1, Math.abs(p * 4 - i));
      layer.slabMaterial.emissive.set(0x47632c);
      layer.slabMaterial.emissiveIntensity = 0.04 + highlighted * 0.15;
      layer.brightMaterial.emissiveIntensity = 0.3 + highlighted * 0.8;
    });
    rods.forEach((rod) => {
      rod.scale.y = separation * 3;
      rod.material.opacity =
        0.18 * (1 - between(0.3, 0.75, p)) + 0.1 * between(0.85, 1, p);
    });
    halo.position.y = -separation * 1.5 - 0.5;
    halo.scale.setScalar(sample([1, 0.96, 0.85, 0.8, 1.1], p));
    pointLight.position.y = sample([4, 1, -1, -3, 2], p);
    pointLight.intensity = sample([28, 30, 28, 40, 35], p);
    const mobile = container.clientWidth < 600;
    const zoom = mobile ? 1.17 : 1;
    const coreReveal = between(0.47, 0.72, p) * (1 - between(0.87, 1, p));
    // Stow beneath the chips, then expand into the space they vacate. The full
    // rotating envelope clears every visible chip in both scroll directions.
    const coreScale = 0.65 + coreReveal * 0.75;
    core.position.y = Math.min(
      -separation * 1.5 - 0.55,
      lowestChip - coreEnvelopeRadius * coreScale - ringClearance,
    );
    core.rotation.set(p * 0.8, p * 2.8, p * 0.35);
    core.scale.setScalar(coreScale);
    nucleus.scale.setScalar(0.63);
    nucleus.rotation.set(p * 3, p * 4, p * 2);
    cage.rotation.set(-p * 1.4, p * 0.7, 0);
    gyros.forEach((gyro, i) => {
      gyro.rotation.set(
        0.45 + i * 0.7 + p * (i % 2 ? 1.7 : -1.2),
        i * 0.8 + p * 0.7,
        i * 0.55 + p * 1.4,
      );
    });
    coreMaterial.emissiveIntensity = 1.1 + coreReveal * 0.9;
    glow.material.opacity = 0.5 + coreReveal * 0.35;
    coreLight.intensity = 18 + coreReveal * 304;
    gate.rotation.z = p * 0.9;
    gate.rotation.y = 0.12 + Math.sin(p * Math.PI) * 0.14;
    gateMaterial.opacity = 0.18 + coreReveal * 0.12;
    camera.position.set(
      (sample([11, 8, 10, 3.3, 11], p) + (still ? 0 : pointer.x)) * zoom,
      (sample([10, 6, 3.5, 0.4, 9], p) + (still ? 0 : pointer.y)) * zoom,
      sample([15, 14, 12, 9, 15], p) * zoom,
    );
    camera.lookAt(0, sample([-0.4, -1, -2.4, -3.1, -0.4], p), 0);
    camera.fov = sample([38, 38, 42, 48, 38], p);
    camera.updateProjectionMatrix();
    dust.rotation.y = p * 0.6;
    dust.position.y = p * -2;
    effects.update(p);
    renderer.render(scene, camera);
    canvas.dataset.progress = p.toFixed(3);
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
    canvas.dataset.triangles = String(renderer.info.render.triangles);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    const geometries = new Set(),
      materials = new Set();
    scene.traverse((o) => {
      if (o.geometry) geometries.add(o.geometry);
      if (o.material)
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
          materials.add(m),
        );
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    lineGeometry.dispose();
    allTextures.forEach((t) => t.dispose());
    environment.dispose();
    renderer.dispose();
    canvas.remove();
  }
  return { render, resize, dispose };
}
