import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Chapter-specific details share the main scene's scroll clock and resource lifecycle.
export function createSystemEffects(
  THREE,
  { layers, core, root, lightweight = false },
) {
  const segments = (full) =>
    lightweight ? Math.max(6, Math.round(full / 2)) : full;
  const matrix = new THREE.Object3D();
  const chips = [];
  const surface = layers[0].group;
  const chipMaterial = new THREE.MeshStandardMaterial({
    color: 0x829978,
    metalness: 0.8,
    roughness: 0.32,
    emissive: 0x749546,
    emissiveIntensity: 0.2,
    transparent: true,
  });
  const chipField = new THREE.InstancedMesh(
    new RoundedBoxGeometry(0.38, 1, 0.34, 1, 0.035),
    chipMaterial,
    45,
  );
  chipField.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // Bounds change as the ripple rises; the parent scene determines visibility.
  chipField.frustumCulled = false;
  surface.add(chipField);
  for (let i = 0; i < 45; i++)
    chips.push({
      x: ((i % 9) - 4) * 0.57,
      z: (Math.floor(i / 9) - 2) * 0.4 + 0.45,
      phase: (i % 9) * 0.4 + Math.floor(i / 9) * 0.7,
    });

  const scanMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { sweep: { value: 0 }, strength: { value: 0 } },
    vertexShader:
      "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader:
      "varying vec2 vUv;uniform float sweep;uniform float strength;void main(){float d=abs(vUv.x-sweep);float beam=exp(-d*90.0)+exp(-d*14.0)*.16;float edge=smoothstep(0.0,.1,vUv.y)*smoothstep(0.0,.1,1.0-vUv.y);gl_FragColor=vec4(.76,1.0,.53,beam*edge*strength);}",
  });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(6.9, 3.5), scanMaterial);
  scan.rotation.x = -Math.PI / 2;
  scan.position.set(0, 0.94, 0.2);
  surface.add(scan);

  const connections = [];
  const connectionMaterial = new THREE.MeshBasicMaterial({
    color: 0xd9ffb0,
    transparent: true,
    opacity: 0.48,
  });
  const people = layers[1].group;
  for (const [x, z] of [
    [-2.4, -0.8],
    [2.4, -0.8],
    [-2.4, 1.3],
    [2.4, 1.3],
  ]) {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(x, 0.22, z),
      new THREE.Vector3(x * 0.5, 1.5, z * 0.5),
      new THREE.Vector3(0, 0.48, 0.2),
    );
    people.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(curve, segments(32), 0.013, 5, false),
        connectionMaterial,
      ),
    );
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xe8ffca, transparent: true }),
    );
    people.add(bead);
    connections.push({ curve, bead });
  }

  const architecture = layers[2].group;
  const towers = [];
  const towerMaterial = new THREE.MeshStandardMaterial({
    color: 0x385647,
    metalness: 0.8,
    roughness: 0.23,
    emissive: 0x4b9458,
    emissiveIntensity: 0.2,
    transparent: true,
  });
  for (const [i, [x, z]] of [
    [-2.7, -0.8],
    [-2.7, 1.25],
    [0, 0.22],
    [2.7, -0.8],
    [2.7, 1.25],
  ].entries()) {
    const tower = new THREE.Group();
    tower.position.set(x, 0.14, z);
    architecture.add(tower);
    for (let j = 0; j < 3; j++) {
      const slab = new THREE.Mesh(
        new RoundedBoxGeometry(0.66, 0.1, 0.47, 1, 0.025),
        towerMaterial,
      );
      slab.position.y = 0.12 + j * 0.17;
      tower.add(slab);
    }
    const beacon = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.012, 0.3),
      new THREE.MeshBasicMaterial({
        color: i === 2 ? 0xffb16b : 0xccffa4,
        transparent: true,
      }),
    );
    beacon.position.y = 0.53;
    tower.add(beacon);
    towers.push(tower);
  }

  // Raised, connected routes replace the tiny disconnected dots on the third chip.
  const routes = [];
  const routing = new THREE.Group();
  architecture.add(routing);
  const routeMaterial = new THREE.MeshBasicMaterial({
    color: 0x91b983,
    transparent: true,
    opacity: 0.5,
  });
  const packetMaterial = new THREE.MeshBasicMaterial({
    color: 0xffcc8b,
    transparent: true,
  });
  const up = new THREE.Vector3(0, 1, 0);
  for (const [i, [x, z]] of [
    [-2.7, -0.8],
    [-2.7, 1.25],
    [2.7, -0.8],
    [2.7, 1.25],
  ].entries()) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0.74, z),
      new THREE.Vector3(x * 0.68, 0.91, z),
      new THREE.Vector3(x * 0.32, 0.91, 0.22),
      new THREE.Vector3(0, 0.74, 0.22),
    ]);
    routing.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(curve, segments(36), 0.024, 6, false),
        routeMaterial,
      ),
    );
    const trailMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { phase: { value: 0 }, strength: { value: 0 } },
      vertexShader:
        "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "varying vec2 vUv;uniform float phase;uniform float strength;void main(){float tail=fract(phase-vUv.x);float glow=exp(-tail*19.0);gl_FragColor=vec4(1.0,.76,.39,glow*strength);}",
    });
    routing.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(curve, 48, 0.058, 6, false),
        trailMaterial,
      ),
    );
    const packet = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.075, 0.21, 3, 8),
      packetMaterial,
    );
    routing.add(packet);
    routes.push({ curve, packet, trailMaterial, offset: i * 0.24 });
  }

  // The fourth layer is a vault: thick plinth, machined towers, sliding doors,
  // and a standing extruded shield. It stows to fit inside the assembled stack.
  const vault = new THREE.Group();
  vault.position.set(0, 0.1, 0.1);
  layers[3].group.add(vault);
  const vaultMetal = new THREE.MeshStandardMaterial({
    color: 0x47614d,
    metalness: 0.82,
    roughness: 0.24,
    transparent: true,
  });
  const vaultTrim = new THREE.MeshStandardMaterial({
    color: 0x617260,
    metalness: 0.8,
    roughness: 0.38,
    transparent: true,
  });
  const vaultLight = new THREE.MeshStandardMaterial({
    color: 0xcaa273,
    emissive: 0xff9c40,
    emissiveIntensity: 0.75,
    metalness: 0.4,
    roughness: 0.23,
    transparent: true,
  });
  function vaultBlock(w, h, d, x, y, z, material, parent = vault) {
    const block = new THREE.Mesh(
      new RoundedBoxGeometry(w, h, d, 1, Math.min(0.045, h * 0.2, d * 0.2)),
      material,
    );
    block.position.set(x, y, z);
    parent.add(block);
    return block;
  }
  vaultBlock(4.1, 0.22, 2.5, 0, 0.11, 0.2, vaultMetal);
  vaultBlock(3.5, 0.13, 2.05, 0, 0.285, 0.2, vaultTrim);
  for (const x of [-1.65, 1.65]) {
    for (const z of [-0.7, 1.1]) {
      vaultBlock(0.36, 1.3, 0.36, x, 0.87, z, vaultMetal);
      vaultBlock(0.42, 0.12, 0.42, x, 1.55, z, vaultTrim);
      vaultBlock(0.18, 0.88, 0.04, x, 0.93, z + 0.195, vaultLight);
    }
    vaultBlock(0.2, 0.18, 2.12, x, 1.58, 0.2, vaultTrim);
  }
  const doors = [];
  for (const side of [-1, 1]) {
    const door = new THREE.Group();
    door.position.set(side * 0.72, 0.36, 1.25);
    vault.add(door);
    vaultBlock(1.38, 1.22, 0.17, 0, 0.61, 0, vaultMetal, door);
    vaultBlock(0.055, 1.05, 0.035, side * -0.62, 0.61, 0.11, vaultLight, door);
    for (let j = 0; j < 3; j++)
      vaultBlock(1.12, 0.04, 0.025, 0, 0.29 + j * 0.31, 0.105, vaultTrim, door);
    doors.push({ door, side });
  }
  // A dark enamel face sits inside a continuous bronze bezel. The silhouette
  // and the raised check are geometry, so they stay crisp at every viewpoint.
  const shieldRim = new THREE.MeshStandardMaterial({
    color: 0xb49262,
    metalness: 0.82,
    roughness: 0.3,
    transparent: true,
  });
  const shieldFace = new THREE.MeshStandardMaterial({
    color: 0x0b1d18,
    metalness: 0.3,
    roughness: 0.52,
    envMapIntensity: 0.45,
    transparent: true,
  });
  const shieldMark = new THREE.MeshStandardMaterial({
    color: 0xe6d5ad,
    metalness: 0.65,
    roughness: 0.27,
    emissive: 0xd69d54,
    emissiveIntensity: 0.12,
    transparent: true,
  });
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.8);
  shape.bezierCurveTo(0.22, 0.66, 0.46, 0.59, 0.65, 0.54);
  shape.quadraticCurveTo(0.7, 0.52, 0.7, 0.45);
  shape.lineTo(0.7, -0.02);
  shape.bezierCurveTo(0.7, -0.42, 0.39, -0.7, 0, -0.9);
  shape.bezierCurveTo(-0.39, -0.7, -0.7, -0.42, -0.7, -0.02);
  shape.lineTo(-0.7, 0.45);
  shape.quadraticCurveTo(-0.7, 0.52, -0.65, 0.54);
  shape.bezierCurveTo(-0.46, 0.59, -0.22, 0.66, 0, 0.8);
  const shieldGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.13,
    curveSegments: lightweight ? 8 : 12,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.035,
    bevelThickness: 0.035,
  });
  const shieldMount = new THREE.Group();
  vault.add(shieldMount);
  const shield = new THREE.Group();
  shieldMount.add(shield);
  shield.add(new THREE.Mesh(shieldGeometry, shieldRim));
  const inset = new THREE.Mesh(shieldGeometry, shieldFace);
  inset.scale.set(0.86, 0.86, 0.38);
  inset.position.z = 0.135;
  shield.add(inset);
  const checkShape = new THREE.Shape();
  checkShape.moveTo(-0.34, -0.02);
  checkShape.lineTo(-0.23, 0.09);
  checkShape.lineTo(-0.07, -0.08);
  checkShape.lineTo(0.27, 0.3);
  checkShape.lineTo(0.38, 0.2);
  checkShape.lineTo(-0.06, -0.29);
  checkShape.closePath();
  const check = new THREE.Mesh(
    new THREE.ExtrudeGeometry(checkShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.01,
      bevelSegments: 2,
      steps: 1,
    }),
    shieldMark,
  );
  check.position.z = 0.21;
  shield.add(check);
  const fastenerGeometry = new THREE.SphereGeometry(0.025, 8, 6);
  for (const [x, y] of [
    [-0.53, 0.4],
    [0.53, 0.4],
    [0, -0.67],
  ]) {
    const fastener = new THREE.Mesh(fastenerGeometry, shieldMark);
    fastener.scale.z = 0.4;
    fastener.position.set(x, y, 0.2);
    shield.add(fastener);
  }
  // Batch the fixed metalwork by material. Fine bevels should not add draw
  // calls; the two door assemblies remain independent for their travel.
  for (const assembly of [vault, ...doors.map(({ door }) => door)]) {
    for (const material of [vaultMetal, vaultTrim, vaultLight]) {
      const blocks = assembly.children.filter(
        (child) => child.isMesh && child.material === material,
      );
      if (!blocks.length) continue;
      const geometries = blocks.map((block) => {
        block.updateMatrix();
        return block.geometry.clone().applyMatrix4(block.matrix);
      });
      assembly.add(new THREE.Mesh(mergeGeometries(geometries), material));
      geometries.forEach((geometry) => geometry.dispose());
      blocks.forEach((block) => {
        assembly.remove(block);
        block.geometry.dispose();
      });
    }
  }

  // Twenty metal facets unfold around the heart, inside the existing ring envelope.
  const shell = new THREE.Group();
  core.add(shell);
  const shellMaterial = new THREE.MeshStandardMaterial({
    color: 0x435247,
    metalness: 0.88,
    roughness: 0.32,
    emissive: 0x9d4b20,
    emissiveIntensity: 0.15,
    side: THREE.DoubleSide,
  });
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xffc187,
    transparent: true,
    opacity: 0.35,
  });
  const ico = new THREE.IcosahedronGeometry(0.91, 0);
  const positions = ico.getAttribute("position");
  const facets = [];
  for (let i = 0; i < positions.count; i += 3) {
    const vertices = [0, 1, 2].map((j) =>
      new THREE.Vector3().fromBufferAttribute(positions, i + j),
    );
    const center = vertices
      .reduce((sum, v) => sum.add(v), new THREE.Vector3())
      .divideScalar(3);
    const geometry = new THREE.BufferGeometry().setFromPoints(
      vertices.map((v) => v.sub(center)),
    );
    geometry.computeVertexNormals();
    const facet = new THREE.Group();
    facet.position.copy(center);
    facet.add(new THREE.Mesh(geometry, shellMaterial));
    facet.add(
      new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial),
    );
    shell.add(facet);
    facets.push({ facet, center, normal: center.clone().normalize() });
  }
  ico.dispose();

  // Data ribbons travel outside the entire chip flight envelope, never through it.
  const ribbonGroup = new THREE.Group();
  root.add(ribbonGroup);
  const ribbonMaterial = new THREE.LineBasicMaterial({
    color: 0x9dc582,
    transparent: true,
    opacity: 0.13,
  });
  const ribbonPaths = [];
  for (let strand = 0; strand < 2; strand++) {
    const points = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160,
        angle = t * Math.PI * 2.2 + strand * Math.PI;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * 10.5,
          -6 + t * 15,
          Math.sin(angle) * 10.5,
        ),
      );
    }
    ribbonGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        ribbonMaterial,
      ),
    );
    ribbonPaths.push(new THREE.CatmullRomCurve3(points));
  }
  const runners = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.038, 6, 4),
    new THREE.MeshBasicMaterial({
      color: 0xd8fbbb,
      transparent: true,
      opacity: 0.7,
    }),
    32,
  );
  runners.frustumCulled = false;
  ribbonGroup.add(runners);

  const clamp = (n) => Math.max(0, Math.min(1, n));
  const smooth = (n) => {
    n = clamp(n);
    return n * n * (3 - 2 * n);
  };
  const range = (a, b, n) => smooth((n - a) / (b - a));
  return {
    update(p) {
      const phase = p * Math.PI * 8;
      chips.forEach(({ x, z, phase: offset }, i) => {
        const height = 0.12 + (Math.sin(offset - phase) + 1) * 0.14;
        matrix.position.set(x, 0.2 + height / 2, z);
        matrix.scale.set(1, height, 1);
        matrix.rotation.set(0, 0, 0);
        matrix.updateMatrix();
        chipField.setMatrixAt(i, matrix.matrix);
      });
      chipField.instanceMatrix.needsUpdate = true;
      chipMaterial.emissiveIntensity = 0.2;
      const sweep = (p * 5) % 1;
      scanMaterial.uniforms.sweep.value = sweep;
      scanMaterial.uniforms.strength.value =
        layers[0].slabMaterial.opacity *
        0.35 *
        range(0, 0.04, sweep) *
        (1 - range(0.96, 1, sweep));
      connections.forEach(({ curve, bead }, i) => {
        const t = (p * 3 + i * 0.22) % 1;
        bead.position.copy(curve.getPoint(t));
        // Disappear at the terminal before the next packet leaves its source.
        bead.scale.setScalar(range(0, 0.08, t) * (1 - range(0.9, 1, t)));
      });
      const architectureDeploy =
        range(0.2, 0.36, p) * (1 - range(0.82, 0.96, p));
      routing.scale.y = 0.4 + architectureDeploy * 0.6;
      towers.forEach((tower) => {
        // Extend the rack spacing without stretching its metal housings.
        for (let level = 0; level < 3; level++)
          tower.children[level].position.y =
            0.12 + level * (0.12 + architectureDeploy * 0.05);
        tower.children[3].position.y = 0.43 + architectureDeploy * 0.1;
      });
      towerMaterial.emissiveIntensity = 0.2;
      routes.forEach(({ curve, packet, trailMaterial, offset }) => {
        const t = (p * 3 + offset) % 1;
        packet.position.copy(curve.getPoint(t));
        packet.scale.setScalar(range(0, 0.07, t) * (1 - range(0.92, 1, t)));
        packet.quaternion.setFromUnitVectors(
          up,
          curve.getTangent(t).normalize(),
        );
        trailMaterial.uniforms.phase.value = t;
        trailMaterial.uniforms.strength.value = layers[2].slabMaterial.opacity;
      });
      const vaultDeploy = range(0.4, 0.57, p) * (1 - range(0.8, 0.94, p));
      const vaultOpen = range(0.48, 0.64, p) * (1 - range(0.8, 0.94, p));
      vault.scale.y = 0.18 + vaultDeploy * 0.82;
      doors.forEach(({ door, side }) => {
        door.position.x = side * (0.72 + vaultOpen * 1.12);
      });
      // Keep the badge rigid while the vault telescopes: it lifts and pivots
      // out of its cradle after the doors start opening, rather than stretching.
      shieldMount.scale.y = 1 / vault.scale.y;
      shieldMount.position.set(0, 0.48 + vaultOpen * 0.85, 0.25);
      shield.rotation.x = (-(1 - vaultOpen) * Math.PI) / 2;
      shield.rotation.y = Math.sin(p * Math.PI * 2) * vaultOpen * 0.12;
      vaultLight.emissiveIntensity = 0.75;
      const unfold = range(0.5, 0.76, p) * (1 - range(0.85, 1, p));
      facets.forEach(({ facet, center, normal }, i) => {
        const extension = unfold * (0.26 + 0.1 * Math.sin(i * 0.9 + phase));
        facet.position.copy(center).addScaledVector(normal, extension);
        facet.rotation.set(
          normal.x * unfold * 0.22,
          normal.y * unfold * 0.22,
          normal.z * unfold * 0.22,
        );
      });
      shell.rotation.set(p * -0.4, p * 0.65, 0);
      shellMaterial.emissiveIntensity = 0.15;
      for (let i = 0; i < 32; i++) {
        const t = (i / 16 + p * 1.6) % 1;
        matrix.position.copy(ribbonPaths[i % 2].getPoint(t));
        matrix.scale.setScalar(1);
        matrix.rotation.set(0, 0, 0);
        matrix.updateMatrix();
        runners.setMatrixAt(i, matrix.matrix);
      }
      runners.instanceMatrix.needsUpdate = true;
      ribbonMaterial.opacity = 0.09;
    },
  };
}
