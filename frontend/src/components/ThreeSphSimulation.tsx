import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { fromArrayBuffer } from 'geotiff';
import { ThreeControlsOverlay } from './ThreeControlsOverlay';

import type { SimulationResult } from '../types';
import { soundEffects } from '../services/soundEffects';

export type CameraViewMode = 'AERIAL' | 'DAM_CREST' | 'DOWNSTREAM_BRIDGE' | 'FOLLOW_WAVE';
export type ParticleRenderMode = '3D_SPHERES' | 'POINT_BEADS';

interface ThreeSphSimulationProps {
  durationMinutes: number;
  onDurationChange: (minutes: number) => void;
  simulation?: SimulationResult | null;
  onNotify?: (title: string, message?: string, type?: 'info' | 'success' | 'warning' | 'danger') => void;
  theme?: 'light' | 'dark';
}

// 5x5 Box Smoothing filter for GeoTIFF DEM
function smoothElevation(data: Float32Array | number[], width: number, height: number): Float32Array {
  const smoothed = new Float32Array(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = ny * width + nx;
            const val = data[idx];
            if (Number.isFinite(val)) {
              sum += val;
              count++;
            }
          }
        }
      }
      const idx = y * width + x;
      smoothed[idx] = count > 0 ? sum / count : data[idx];
    }
  }
  return smoothed;
}

// True canyon riverbed centerline X coordinate interpolated from DEM waypoints
function getCanalCenterlineX(z: number): number {
  if (z >= 246) return 152;
  if (z >= 180) return 152 + ((z - 246) / (180 - 246)) * (142 - 152);
  if (z >= 118) return 142 + ((z - 180) / (118 - 180)) * (123 - 142);
  if (z >= 54) return 123 + ((z - 118) / (54 - 118)) * (46 - 123);
  if (z >= -10) return 46 + ((z - 54) / (-10 - 54)) * (8 - 46);
  if (z >= -74) return 8 + ((z - (-10)) / (-74 - (-10))) * (43 - 8);
  if (z >= -106) return 43 + ((z - (-74)) / (-106 - (-74))) * (37 - 43); // Canyon Bridge
  if (z >= -170) return 37 + ((z - (-106)) / (-170 - (-106))) * (-5 - 37);
  if (z >= -266) return -5 + ((z - (-170)) / (-266 - (-170))) * (-8 - (-5));
  if (z >= -362) return -8 + ((z - (-266)) / (-362 - (-266))) * (-56 - (-8));
  if (z >= -426) return -56 + ((z - (-362)) / (-426 - (-362))) * (-123 - (-56));
  return -123 + ((z - (-426)) / (-560 - (-426))) * (-142 - (-123));
}

// True canyon valley half-width (meters): defines the natural flood corridor width
function getValleyHalfWidth(z: number): number {
  if (z >= 246) return 95.0;  // Upstream reservoir basin
  if (z >= 180) return 36.0;  // Constricted gorge immediately below dam
  if (z >= 54) return 46.0;   // Canyon chute
  if (z >= -74) return 54.0;  // Winding gorge
  if (z >= -140) return 68.0; // Suspension bridge reach
  if (z >= -280) return 90.0; // Valley settlement floodplain
  if (z >= -420) return 118.0; // Lower floodplain
  return 148.0;               // Broad downstream alluvial basin
}

// Compact high-definition 3D spherical droplet bead texture with darker rich fluid tones
function createSphDropletTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const cx = 64;
  const cy = 64;
  const r = 56;

  const sphereGrad = ctx.createRadialGradient(cx - 16, cy - 18, 4, cx, cy, r);
  sphereGrad.addColorStop(0, 'rgba(180, 230, 255, 1.0)');
  sphereGrad.addColorStop(0.25, 'rgba(0, 130, 215, 0.98)');
  sphereGrad.addColorStop(0.60, 'rgba(2, 50, 140, 0.95)');
  sphereGrad.addColorStop(0.88, 'rgba(1, 25, 80, 0.92)');
  sphereGrad.addColorStop(0.96, 'rgba(0, 12, 45, 0.88)');
  sphereGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = sphereGrad;
  ctx.fill();

  ctx.lineWidth = 3.5;
  ctx.strokeStyle = 'rgba(0, 12, 50, 0.92)';
  ctx.stroke();

  const causticGrad = ctx.createRadialGradient(cx + 14, cy + 18, 2, cx + 10, cy + 14, 28);
  causticGrad.addColorStop(0, 'rgba(0, 160, 245, 0.55)');
  causticGrad.addColorStop(1, 'rgba(0, 70, 160, 0.0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
  ctx.fillStyle = causticGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx - 18, cy - 20, 10, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx - 8, cy - 28, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

// Critical downstream landmarks for asset submersion telemetry
const CRITICAL_ASSETS = [
  { id: 'dam_toe', name: 'Dam Toe Stilling Basin', x: 152, z: 220, thresholdDistM: 60 },
  { id: 'canyon_gorge', name: 'Narrow Chute Constriction', x: 80, z: 20, thresholdDistM: 280 },
  { id: 'bridge', name: 'Canyon Suspension Bridge', x: 37, z: -106, thresholdDistM: 520 },
  { id: 'village_north', name: 'Valley Settlement A', x: -10, z: -230, thresholdDistM: 820 },
  { id: 'village_south', name: 'Valley Settlement B', x: -50, z: -350, thresholdDistM: 1100 }
];

export const ThreeSphSimulation: React.FC<ThreeSphSimulationProps> = ({
  durationMinutes,
  onDurationChange,
  simulation,
  onNotify,
  theme = 'light'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulation State
  const [simTimeSec, setSimTimeSec] = useState<number>(-30);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(5);
  const [viewMode, setViewMode] = useState<CameraViewMode>('AERIAL');
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [showWaterSurface, setShowWaterSurface] = useState<boolean>(false);
  const [particleRenderMode, setParticleRenderMode] = useState<ParticleRenderMode>('3D_SPHERES');
  const [particleScale, setParticleScale] = useState<number>(1.35);
  const [simStatus, setSimStatus] = useState<'PRE_BREAK' | 'BREACHING' | 'SURGING' | 'COMPLETED'>('PRE_BREAK');
  const [submergedAssetsCount, setSubmergedAssetsCount] = useState<number>(0);
  const [waveFrontDistM, setWaveFrontDistM] = useState<number>(0);
  const [demSource, setDemSource] = useState<string>('Real GeoTIFF (default.tif)');

  // Hydraulic Telemetry
  const [froudeNumber, setFroudeNumber] = useState<number>(0);
  const [currentDischargeM3s, setCurrentDischargeM3s] = useState<number>(0);
  const [maxVelocityMs, setMaxVelocityMs] = useState<number>(0);
  const [avgDepthM, setAvgDepthM] = useState<number>(0);
  const [manningN, setManningN] = useState<number>(0.035);

  // Three.js References
  const animFrameId = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const waterSurfaceMeshRef = useRef<THREE.Mesh | null>(null);
  const instancedSpheresRef = useRef<THREE.InstancedMesh | null>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const resetParticlesRef = useRef<(() => void) | null>(null);

  // Continuous DEM Height & Gradient Sampling
  const heightLookupRef = useRef<((x: number, z: number) => number)>((_x, _z) => 0);
  const gradientLookupRef = useRef<((x: number, z: number) => { gradX: number; gradZ: number; y: number })>(
    (_x, _z) => ({ gradX: 0, gradZ: 0, y: 0 })
  );

  const simParamsRef = useRef({
    timeSec: -30,
    maxDurationSec: durationMinutes * 60,
    isPlaying: true,
    speed: 5,
    viewMode: 'AERIAL' as CameraViewMode,
    showParticles: true,
    showWaterSurface: false,
    particleRenderMode: '3D_SPHERES' as ParticleRenderMode,
    particleScale: 1.2,
    manningN: 0.035
  });

  useEffect(() => {
    simParamsRef.current.maxDurationSec = durationMinutes * 60;
  }, [durationMinutes]);

  useEffect(() => {
    simParamsRef.current.isPlaying = isPlaying;
    simParamsRef.current.speed = simSpeed;
    simParamsRef.current.viewMode = viewMode;
    simParamsRef.current.showParticles = showParticles;
    simParamsRef.current.showWaterSurface = showWaterSurface;
    simParamsRef.current.particleRenderMode = particleRenderMode;
    simParamsRef.current.particleScale = particleScale;
    simParamsRef.current.manningN = manningN;
  }, [isPlaying, simSpeed, viewMode, showParticles, showWaterSurface, particleRenderMode, particleScale, manningN]);

  // Dynamically update 3D sky & fog when theme changes
  useEffect(() => {
    if (sceneRef.current) {
      const isLight = theme === 'light';
      const skyColor = isLight ? 0xdbeafe : 0x0a0f18;
      sceneRef.current.background = new THREE.Color(skyColor);
      sceneRef.current.fog = new THREE.FogExp2(skyColor, isLight ? 0.00025 : 0.00030);
    }
  }, [theme]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (window.innerHeight - 140);

    // 1. Scene setup
    const scene = new THREE.Scene();
    const isLight = theme === 'light';
    const skyColor = isLight ? 0xdbeafe : 0x0a0f18;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, isLight ? 0.00025 : 0.00030);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(52, width / height, 1, 15000);
    camera.position.set(450, 480, 520);
    cameraRef.current = camera;

    // 3. Renderer (High-Performance GPU Profile)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 30, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controls.maxDistance = 6500;
    controlsRef.current = controls;

    // 5. Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.52);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 4.2);
    dirLight.position.set(520, 800, 480);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 50;
    dirLight.shadow.camera.far = 3200;
    const sd = 900;
    dirLight.shadow.camera.left = -sd;
    dirLight.shadow.camera.right = sd;
    dirLight.shadow.camera.top = sd;
    dirLight.shadow.camera.bottom = -sd;
    scene.add(dirLight);

    const blueFill = new THREE.DirectionalLight(0x00aaff, 1.2);
    blueFill.position.set(-450, 350, -450);
    scene.add(blueFill);

    // -------------------------------------------------------------
    // 6. 3.2X Scale Real-Life GeoTIFF Terrain Builder
    // -------------------------------------------------------------
    const terrainScale = 3.2;
    const elevationScale = 145.0;

    const buildTerrainFromTiffBuffer = async (buffer: ArrayBuffer, fileName: string = 'default.tif') => {
      try {
        const tiff = await fromArrayBuffer(buffer);
        const image = await tiff.getImage();
        const tWidth = image.getWidth();
        const tHeight = image.getHeight();
        const rasters = await image.readRasters();
        const rawBand = rasters[0] as Float32Array;

        const band = smoothElevation(rawBand, tWidth, tHeight);

        let minElev = Number.POSITIVE_INFINITY;
        let maxElev = Number.NEGATIVE_INFINITY;
        for (let i = 0; i < band.length; i++) {
          const val = band[i];
          if (Number.isFinite(val)) {
            if (val < minElev) minElev = val;
            if (val > maxElev) maxElev = val;
          }
        }

        const valueRange = maxElev - minElev || 1.0;
        const scaledWidth = tWidth * terrainScale;
        const scaledHeight = tHeight * terrainScale;

        const geometry = new THREE.PlaneGeometry(scaledWidth, scaledHeight, tWidth - 1, tHeight - 1);
        geometry.rotateX(-Math.PI / 2);

        const pos = geometry.attributes.position;
        const colors = new Float32Array(tWidth * tHeight * 3);

        for (let y = 0; y < tHeight; y++) {
          for (let x = 0; x < tWidth; x++) {
            const idx = y * tWidth + x;
            const val = band[idx];
            const norm = Number.isFinite(val) ? (val - minElev) / valueRange : 0;
            const hVal = Math.max(0, norm * elevationScale);

            pos.setY(idx, hVal);

            let r: number, g: number, b: number;
            if (norm < 0.24) {
              r = 0.18; g = 0.58; b = 0.22;
            } else if (norm < 0.50) {
              r = 0.56; g = 0.68; b = 0.20;
            } else if (norm < 0.74) {
              r = 0.52; g = 0.36; b = 0.16;
            } else {
              r = 0.88; g = 0.88; b = 0.88;
            }

            colors[idx * 3] = r;
            colors[idx * 3 + 1] = g;
            colors[idx * 3 + 2] = b;
          }
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();

        if (terrainMeshRef.current) {
          scene.remove(terrainMeshRef.current);
          terrainMeshRef.current.geometry.dispose();
        }

        const material = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.42,
          metalness: 0.05,
          flatShading: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.receiveShadow = true;
        mesh.position.set(0, 0, 0);

        scene.add(mesh);
        terrainMeshRef.current = mesh;
        setDemSource(fileName);

        const sampleBilinear = (gx: number, gy: number): number => {
          if (gx < 0 || gx >= tWidth - 1 || gy < 0 || gy >= tHeight - 1) return 0;
          const x0 = Math.floor(gx);
          const y0 = Math.floor(gy);
          const fx = gx - x0;
          const fy = gy - y0;
          const v00 = band[y0 * tWidth + x0];
          const v10 = band[y0 * tWidth + (x0 + 1)];
          const v01 = band[(y0 + 1) * tWidth + x0];
          const v11 = band[(y0 + 1) * tWidth + (x0 + 1)];
          if (!Number.isFinite(v00)) return 0;
          const elev = (1 - fx) * (1 - fy) * v00 + fx * (1 - fy) * v10 + (1 - fx) * fy * v01 + fx * fy * v11;
          return Math.max(0, ((elev - minElev) / valueRange) * elevationScale);
        };

        heightLookupRef.current = (worldX: number, worldZ: number): number => {
          const gx = (worldX + scaledWidth / 2) / terrainScale;
          const gy = (worldZ + scaledHeight / 2) / terrainScale;
          return sampleBilinear(gx, gy);
        };

        gradientLookupRef.current = (worldX: number, worldZ: number) => {
          const gx = (worldX + scaledWidth / 2) / terrainScale;
          const gy = (worldZ + scaledHeight / 2) / terrainScale;
          const y = sampleBilinear(gx, gy);

          const eps = 2.0;
          const gxL = (worldX - eps + scaledWidth / 2) / terrainScale;
          const gxR = (worldX + eps + scaledWidth / 2) / terrainScale;
          const gyD = (worldZ - eps + scaledHeight / 2) / terrainScale;
          const gyU = (worldZ + eps + scaledHeight / 2) / terrainScale;

          const hL = sampleBilinear(gxL, gy);
          const hR = sampleBilinear(gxR, gy);
          const hD = sampleBilinear(gx, gyD);
          const hU = sampleBilinear(gx, gyU);

          const gradX = (hR - hL) / (2 * eps);
          const gradZ = (hU - hD) / (2 * eps);

          return { gradX, gradZ, y };
        };

        controls.target.set(0, 35, 0);
        camera.position.set(scaledWidth * 0.65, elevationScale * 2.5, scaledHeight * 0.65);
      } catch (err) {
        console.error('Failed to parse DEM GeoTIFF:', err);
      }
    };

    fetch('/default.tif')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch default.tif');
        return res.arrayBuffer();
      })
      .then((buf) => buildTerrainFromTiffBuffer(buf, 'Real GeoTIFF (default.tif)'))
      .catch((e) => console.warn('GeoTIFF load error, falling back:', e));

    (window as any).__loadCustomDemTif = (buf: ArrayBuffer, name: string) => {
      buildTerrainFromTiffBuffer(buf, name);
    };

    // -------------------------------------------------------------
    // 7. Dynamic Dam Structure Across the Gorge (Constriction wx=152, wz=246)
    // -------------------------------------------------------------
    const damGroup = new THREE.Group();
    damGroup.position.set(152, 70, 246);
    damGroup.rotation.y = -0.42;

    const damMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.65,
      metalness: 0.2
    });

    const leftDam = new THREE.Mesh(new THREE.BoxGeometry(65, 40, 16), damMat);
    leftDam.position.set(-52, 0, 0);
    leftDam.castShadow = true;
    leftDam.receiveShadow = true;
    damGroup.add(leftDam);

    const rightDam = new THREE.Mesh(new THREE.BoxGeometry(65, 40, 16), damMat);
    rightDam.position.set(52, 0, 0);
    rightDam.castShadow = true;
    rightDam.receiveShadow = true;
    damGroup.add(rightDam);

    const breachMesh = new THREE.Mesh(new THREE.BoxGeometry(42, 38, 15), damMat);
    breachMesh.position.set(0, 0, 0);
    breachMesh.castShadow = true;
    breachMesh.receiveShadow = true;
    damGroup.add(breachMesh);

    const crestRoad = new THREE.Mesh(
      new THREE.BoxGeometry(150, 2.5, 14),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.9 })
    );
    crestRoad.position.set(0, 20, 0);
    damGroup.add(crestRoad);

    scene.add(damGroup);

    // -------------------------------------------------------------
    // 8. Reservoir Lake (Upstream Natural Basin at wz > 250)
    // -------------------------------------------------------------
    const lakeGeo = new THREE.PlaneGeometry(240, 220, 24, 24);
    lakeGeo.rotateX(-Math.PI / 2);
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x034b7f,
      roughness: 0.12,
      metalness: 0.75,
      transparent: true,
      opacity: 0.85
    });
    const reservoirLake = new THREE.Mesh(lakeGeo, lakeMat);
    reservoirLake.position.set(165, 84, 350);
    scene.add(reservoirLake);

    // -------------------------------------------------------------
    // 9. Downstream Canyon Infrastructure
    // -------------------------------------------------------------
    const assetsGroup = new THREE.Group();

    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.75, roughness: 0.3 });
    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(110, 4, 14), bridgeMat);
    bridgeDeck.position.set(37, 56, -106);
    bridgeDeck.rotation.y = 0.55;
    bridgeDeck.castShadow = true;
    assetsGroup.add(bridgeDeck);

    const houseColors = [0xfde047, 0xf97316, 0x38bdf8, 0xe2e8f0];
    const buildingPositions = [
      { x: 28, z: -160, w: 16, h: 14, d: 16 },
      { x: -35, z: -210, w: 20, h: 16, d: 18 },
      { x: 22, z: -250, w: 18, h: 15, d: 16 },
      { x: -45, z: -310, w: 22, h: 18, d: 20 }
    ];

    buildingPositions.forEach((bp, idx) => {
      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(bp.w, bp.h, bp.d),
        new THREE.MeshStandardMaterial({ color: houseColors[idx % houseColors.length], roughness: 0.6 })
      );
      bMesh.position.set(bp.x, 50, bp.z);
      bMesh.castShadow = true;
      assetsGroup.add(bMesh);

      const rMesh = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(bp.w, bp.d) * 0.75, 8, 4),
        new THREE.MeshStandardMaterial({ color: 0x991b1b })
      );
      rMesh.rotateY(Math.PI / 4);
      rMesh.position.set(bp.x, 50 + bp.h / 2 + 4, bp.z);
      assetsGroup.add(rMesh);
    });

    scene.add(assetsGroup);

    // -------------------------------------------------------------
    // 10. Dynamic Continuous Deformable Water Surface Mesh (Toggleable)
    // -------------------------------------------------------------
    const wsWidth = 320;
    const wsLength = 880;
    const wsSegX = 46;
    const wsSegZ = 110;
    const wsGeo = new THREE.PlaneGeometry(wsWidth, wsLength, wsSegX, wsSegZ);
    wsGeo.rotateX(-Math.PI / 2);

    const wsColors = new Float32Array((wsSegX + 1) * (wsSegZ + 1) * 3);
    wsGeo.setAttribute('color', new THREE.BufferAttribute(wsColors, 3));

    const wsMat = new THREE.MeshStandardMaterial({
      color: 0x034b7f,
      roughness: 0.12,
      metalness: 0.65,
      transparent: true,
      opacity: 0.85,
      vertexColors: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const waterSurfaceMesh = new THREE.Mesh(wsGeo, wsMat);
    waterSurfaceMesh.position.set(20, 0, -180);
    waterSurfaceMesh.visible = false;
    scene.add(waterSurfaceMesh);
    waterSurfaceMeshRef.current = waterSurfaceMesh;

    // -------------------------------------------------------------
    // 11. Optimized High-Volume SPH Particle Swarm (18,000 Droplets)
    // -------------------------------------------------------------
    // 18,000 physical droplets spread across the full 70m - 280m valley floodplain
    // with 14 stacked depth tiers, calibrated with 2.45m sphere radius for dense volumetric surge at 60 FPS!
    const particleCount = 18000;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const velocities = new Float32Array(particleCount * 3);
    const densities = new Float32Array(particleCount);
    const pressures = new Float32Array(particleCount);
    const particleState = new Uint8Array(particleCount);
    const particleAge = new Float32Array(particleCount);
    // Quasi-random golden ratio lateral lane across the full valley corridor [-1.0, 1.0]
    const pLateralFrac = new Float32Array(particleCount);
    // Vertical depth tier fraction [0.0 (riverbed) to 1.0 (surface crest)]
    const pDepthFrac = new Float32Array(particleCount);

    // Physical Constants (Navier-Stokes WCSPH & Tait EOS)
    const REST_DENSITY = 1.0;
    const GAMMA_TAIT = 7.0; // Polytropic index for water
    const SPEED_OF_SOUND = 30.0; // Numerical sound speed c_s ~ 10 * v_max
    const TAIT_B = (REST_DENSITY * SPEED_OF_SOUND * SPEED_OF_SOUND) / GAMMA_TAIT; // Stiffness constant B
    const SPH_RADIUS = 10.0;
    const H2 = SPH_RADIUS * SPH_RADIUS;
    const POLY6_COEFF = 315.0 / (64.0 * Math.PI * Math.pow(SPH_RADIUS, 9));
    const SPIKY_GRAD_COEFF = -45.0 / (Math.PI * Math.pow(SPH_RADIUS, 6));
    const MONAGHAN_ALPHA = 0.10; // Anti-clustering artificial viscosity coefficient
    const GRAVITY = 9.81;

    // Fast 2D Spatial Hash Grid
    const GRID_MIN_X = -320;
    const GRID_MAX_X = 360;
    const GRID_MIN_Z = -640;
    const GRID_MAX_Z = 460;
    const CELL_SIZE = 16.0;
    const GRID_COLS = Math.ceil((GRID_MAX_X - GRID_MIN_X) / CELL_SIZE);
    const GRID_ROWS = Math.ceil((GRID_MAX_Z - GRID_MIN_Z) / CELL_SIZE);
    const TOTAL_CELLS = GRID_COLS * GRID_ROWS;
    const gridHead = new Int32Array(TOTAL_CELLS);
    const particleNext = new Int32Array(particleCount);

    // Seed 18,000 particles filling the entire reservoir volume
    const initParticleReservoir = () => {
      for (let i = 0; i < particleCount; i++) {
        // Golden ratio lateral spread ensures completely uniform bank-to-bank distribution
        pLateralFrac[i] = (((i * 1.61803398875) % 1.0) * 2.0) - 1.0;
        // 14 vertical depth layers for deep multi-tier fluid body
        pDepthFrac[i] = (i % 14) / 13.0;

        // Upstream natural reservoir lake basin
        const rx = 152 + (Math.random() - 0.5) * 175.0;
        const rz = 250 + Math.random() * 165.0;
        const ry = 66.0 + pDepthFrac[i] * 18.0 + Math.random() * 1.5;

        particlePositions[i * 3] = rx;
        particlePositions[i * 3 + 1] = ry;
        particlePositions[i * 3 + 2] = rz;

        velocities[i * 3] = (Math.random() - 0.5) * 0.4;
        velocities[i * 3 + 1] = 0;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

        particleState[i] = 0;
        particleAge[i] = 0;

        // Dark deep oceanic aquatic tone
        particleColors[i * 3] = 0.01;
        particleColors[i * 3 + 1] = 0.12;
        particleColors[i * 3 + 2] = 0.40;
      }
    };
    initParticleReservoir();
    resetParticlesRef.current = initParticleReservoir;

    // MODE A: True 3D Spherical Water Beads
    // Optimized droplet radius 2.45m: robust physical volume filling the broad valley at smooth 60 FPS
    const sphereRadius = 2.45;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, 6, 5);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x052a54,
      roughness: 0.18,
      metalness: 0.22
    });

    const instancedSpheres = new THREE.InstancedMesh(sphereGeo, sphereMat, particleCount);
    instancedSpheres.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedSpheres.castShadow = false;
    instancedSpheres.receiveShadow = false;

    const instanceColorBuffer = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      instanceColorBuffer[i * 3] = 0.01;
      instanceColorBuffer[i * 3 + 1] = 0.12;
      instanceColorBuffer[i * 3 + 2] = 0.40;
    }
    instancedSpheres.instanceColor = new THREE.InstancedBufferAttribute(instanceColorBuffer, 3);
    scene.add(instancedSpheres);
    instancedSpheresRef.current = instancedSpheres;

    // MODE B: Points Droplet Beads
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 9.5,
      vertexColors: true,
      map: createSphDropletTexture(),
      transparent: true,
      opacity: 0.98,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    particleSystem.visible = false;
    scene.add(particleSystem);
    particleSystemRef.current = particleSystem;

    // -------------------------------------------------------------
    // 12. Main Hydrodynamic Physics Animation Loop
    // -------------------------------------------------------------
    let lastClockTime = performance.now();
    let lastTelemetryTime = 0;

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      const now = performance.now();
      const dtReal = Math.min((now - lastClockTime) / 1000.0, 0.06);
      lastClockTime = now;

      controls.update();

      const p = simParamsRef.current;
      const dtSim = dtReal * p.speed;

      // Clock advance
      if (p.isPlaying) {
        p.timeSec += dtSim;
        if (p.timeSec >= p.maxDurationSec) {
          p.timeSec = p.maxDurationSec;
          p.isPlaying = false;
          setIsPlaying(false);
        }
      }

      const tSec = p.timeSec;
      const isPostBreak = tSec >= 0;

      // Realtime status determination
      let currentSimStatus: 'PRE_BREAK' | 'BREACHING' | 'SURGING' | 'COMPLETED' = 'PRE_BREAK';
      if (p.timeSec >= p.maxDurationSec) {
        currentSimStatus = 'COMPLETED';
      } else if (tSec < 0) {
        currentSimStatus = 'PRE_BREAK';
      } else if (tSec < 35) {
        currentSimStatus = 'BREACHING';
      } else {
        currentSimStatus = 'SURGING';
      }

      // Dam breach progression
      let breachProgress = 0.0;
      let breachWidth = 0.0;
      let reservoirHead = 84.0;

      if (tSec < 0) {
        breachMesh.position.y = 0;
        breachMesh.scale.set(1.0, 1.0, 1.0);
        crestRoad.position.y = 20.0;
        reservoirLake.position.y = 84.0 + Math.sin(now * 0.002) * 0.25;
      } else {
        breachProgress = Math.min(1.0, tSec / 40.0);
        breachWidth = 18.0 + breachProgress * 30.0; // Expands to 48m breach opening
        breachMesh.position.y = -(breachProgress * 35.0);
        breachMesh.scale.x = Math.max(0.1, 1.0 - (breachProgress * 0.7));
        crestRoad.position.y = 20.0 - (breachProgress * 38.0);

        const drainProg = Math.min(1.0, tSec / p.maxDurationSec);
        reservoirHead = Math.max(42.0, 84.0 - (drainProg * 42.0));
        reservoirLake.position.y = reservoirHead;
      }

      let instantDischargeM3s = 0;
      if (isPostBreak) {
        const breachDepth = Math.max(0, reservoirHead - 45.0);
        instantDischargeM3s = Math.round(1.7 * breachWidth * Math.sqrt(GRAVITY) * Math.pow(breachDepth, 1.5) * 0.52);
      }

      // -------------------------------------------------------------
      // 13. SPH Spatial Grid Build & Hydrodynamic Force Integration
      // -------------------------------------------------------------
      gridHead.fill(-1);

      for (let i = 0; i < particleCount; i++) {
        const px = particlePositions[i * 3];
        const pz = particlePositions[i * 3 + 2];
        const cx = Math.floor((px - GRID_MIN_X) / CELL_SIZE);
        const cz = Math.floor((pz - GRID_MIN_Z) / CELL_SIZE);
        if (cx >= 0 && cx < GRID_COLS && cz >= 0 && cz < GRID_ROWS) {
          const cell = cz * GRID_COLS + cx;
          particleNext[i] = gridHead[cell];
          gridHead[cell] = i;
        } else {
          particleNext[i] = -1;
        }
      }

      // Pass 1: SPH Density & Tait Pressure (capped to 6 neighbors for 60 FPS performance with 60,000 particles)
      for (let i = 0; i < particleCount; i++) {
        const px = particlePositions[i * 3];
        const pz = particlePositions[i * 3 + 2];
        const cx = Math.floor((px - GRID_MIN_X) / CELL_SIZE);
        const cz = Math.floor((pz - GRID_MIN_Z) / CELL_SIZE);

        let density = 0.5;
        let neighborsChecked = 0;
        if (cx >= 0 && cx < GRID_COLS && cz >= 0 && cz < GRID_ROWS) {
          for (let dz = -1; dz <= 1; dz++) {
            const ncz = cz + dz;
            if (ncz < 0 || ncz >= GRID_ROWS) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const ncx = cx + dx;
              if (ncx < 0 || ncx >= GRID_COLS) continue;
              let j = gridHead[ncz * GRID_COLS + ncx];
              while (j !== -1 && neighborsChecked < 6) {
                if (j !== i) {
                  const djx = px - particlePositions[j * 3];
                  const djz = pz - particlePositions[j * 3 + 2];
                  const r2 = djx * djx + djz * djz;
                  if (r2 < H2) {
                    const diff = H2 - r2;
                    density += diff * diff * diff * POLY6_COEFF * 2.5;
                    neighborsChecked++;
                  }
                }
                j = particleNext[j];
              }
            }
          }
        }
        densities[i] = density;
        // True Tait Equation of State for WCSPH: P = B * ((rho / rho0)^gamma - 1)
        const rhoRatio = Math.max(0.75, Math.min(2.2, density / REST_DENSITY));
        pressures[i] = Math.max(0, TAIT_B * (Math.pow(rhoRatio, GAMMA_TAIT) - 1.0));
      }

      // Pass 2: Hydrodynamic Force Integration & Broad Floodplain Surge
      let maxSpeedFound = 0;
      let sumSpeed = 0;
      let sumDepth = 0;
      let activeCount = 0;
      let maxFrontZ = 246;

      const dtPhysics = Math.min(dtSim * 0.70, 0.08);

      const matrixArray = instancedSpheres.instanceMatrix.array as Float32Array;
      const instColorArray = instancedSpheres.instanceColor!.array as Float32Array;
      const is3dMode = p.particleRenderMode === '3D_SPHERES';
      const pScale = p.particleScale;

      // Analytical Ritter-Dressler wave front tracking with bed friction deceleration
      const surgeTimeSec = Math.max(0, tSec);
      const effHead = Math.max(4.0, reservoirHead - 48.0);
      const c0 = Math.sqrt(GRAVITY * effHead);
      const u0 = 2.0 * c0;
      const kDecel = Math.max(0.012, (GRAVITY * Math.pow(p.manningN, 2) * 12.0) / Math.pow(effHead, 1.33));
      const distFront = (u0 / kDecel) * Math.log(1.0 + kDecel * surgeTimeSec * 0.95);
      const waveFrontZ = Math.max(-565.0, 246.0 - distFront);

      for (let i = 0; i < particleCount; i++) {
        let px = particlePositions[i * 3];
        let py = particlePositions[i * 3 + 1];
        let pz = particlePositions[i * 3 + 2];
        let vx = velocities[i * 3];
        let vy = velocities[i * 3 + 1];
        let vz = velocities[i * 3 + 2];

        // -------------------------------------------------------------
        // State A: Pre-Break Reservoir (Calm, Deep Stratified Reservoir Lake)
        // -------------------------------------------------------------
        if (!isPostBreak) {
          const phase = now * 0.002 + i * 0.03;
          vx = Math.sin(phase) * 1.2;
          vz = Math.cos(phase * 0.8) * 1.2;
          px += vx * dtSim;
          pz += vz * dtSim;

          if (px < 65) px = 65 + Math.random() * 4;
          if (px > 240) px = 240 - Math.random() * 4;
          if (pz < 248) {
            pz = 248 + Math.random() * 3;
            vz = Math.abs(vz) * 0.5;
          }
          if (pz > 410) pz = 410 - Math.random() * 4;

          const bedY = heightLookupRef.current(px, pz);
          const targetY = bedY + 1.2 + pDepthFrac[i] * (reservoirLake.position.y - bedY);
          py = THREE.MathUtils.lerp(py, targetY, 0.25);

          particlePositions[i * 3] = px;
          particlePositions[i * 3 + 1] = py;
          particlePositions[i * 3 + 2] = pz;
          velocities[i * 3] = vx;
          velocities[i * 3 + 1] = vy;
          velocities[i * 3 + 2] = vz;

          const cr = 0.01 + pDepthFrac[i] * 0.03;
          const cg = 0.12 + pDepthFrac[i] * 0.12;
          const cb = 0.40 + pDepthFrac[i] * 0.18;
          particleColors[i * 3] = cr;
          particleColors[i * 3 + 1] = cg;
          particleColors[i * 3 + 2] = cb;

          if (is3dMode) {
            const idx16 = i * 16;
            matrixArray[idx16 + 0] = pScale;
            matrixArray[idx16 + 5] = pScale;
            matrixArray[idx16 + 10] = pScale;
            matrixArray[idx16 + 12] = px;
            matrixArray[idx16 + 13] = py;
            matrixArray[idx16 + 14] = pz;

            instColorArray[i * 3] = cr;
            instColorArray[i * 3 + 1] = cg;
            instColorArray[i * 3 + 2] = cb;
          }
          continue;
        }

        // -------------------------------------------------------------
        // Dynamic Allocation: Instant Massive Downstream Flood Wave (42k particles)
        // -------------------------------------------------------------
        const downstreamThreshold = Math.floor(particleCount * 0.7);
        if (i < downstreamThreshold && particleState[i] === 0) {
          // Immediately populate the active flood reach [waveFrontZ, 244] across the full valley
          const floodReach = Math.max(10.0, 244.0 - waveFrontZ);
          const longFrac = (i / downstreamThreshold);
          const initZ = 244.0 - longFrac * floodReach;
          const initCX = getCanalCenterlineX(initZ);
          const initWH = getValleyHalfWidth(initZ);
          const initX = initCX + pLateralFrac[i] * (initWH * 0.88);
          const initBedY = heightLookupRef.current(initX, initZ);
          const initThalY = heightLookupRef.current(initCX, initZ);
          const initFloodH = Math.max(7.5, 16.0 - ((246.0 - initZ) / 800.0) * 8.0);
          const initDepth = Math.max(2.5, (initThalY + initFloodH) - initBedY);

          px = initX;
          py = initBedY + 0.6 + pDepthFrac[i] * initDepth;
          pz = initZ;
          vx = (Math.random() - 0.5) * 4.0;
          vy = 0.5;
          vz = -(18.0 + Math.random() * 12.0);
          particleState[i] = 1;
        }

        // -------------------------------------------------------------
        // State B: Upstream Reservoir Suction (Continuous breach cascade)
        // -------------------------------------------------------------
        if (pz > 246 && particleState[i] === 0) {
          const toBreachX = 152 - px;
          const toBreachZ = 244 - pz;
          const distToBreach = Math.hypot(toBreachX, toBreachZ);

          if (pz <= 250 && Math.abs(px - 152) < Math.max(18, breachWidth * 0.85)) {
            particleState[i] = 1;
            pz = 244 - Math.random() * 4;
            const torricelliV = Math.sqrt(2 * GRAVITY * Math.max(4, reservoirHead - 48.0));
            vz = -(torricelliV * (0.85 + Math.random() * 0.35) + 6.0);
            vx = (Math.random() - 0.5) * 5.0;
            vy = 1.5 + Math.random() * 3.5;
          } else {
            const pullSpeed = Math.min(26.0, 8.0 + (breachProgress * 18.0) / Math.max(1.0, distToBreach * 0.04));
            vx = (toBreachX / distToBreach) * pullSpeed + (Math.random() - 0.5) * 1.5;
            vz = (toBreachZ / distToBreach) * pullSpeed;

            px += vx * dtPhysics;
            pz += vz * dtPhysics;

            if (px < 65) px = 65 + Math.random() * 4;
            if (px > 240) px = 240 - Math.random() * 4;
            if (pz > 410) pz = 410 - Math.random() * 4;

            const bedY = heightLookupRef.current(px, pz);
            py = THREE.MathUtils.lerp(py, bedY + 1.2 + pDepthFrac[i] * (reservoirHead - bedY), 0.25);
          }

          particlePositions[i * 3] = px;
          particlePositions[i * 3 + 1] = py;
          particlePositions[i * 3 + 2] = pz;
          velocities[i * 3] = vx;
          velocities[i * 3 + 1] = vy;
          velocities[i * 3 + 2] = vz;

          const cr = 0.01;
          const cg = 0.12;
          const cb = 0.40;
          particleColors[i * 3] = cr;
          particleColors[i * 3 + 1] = cg;
          particleColors[i * 3 + 2] = cb;

          if (is3dMode) {
            const idx16 = i * 16;
            matrixArray[idx16 + 0] = pScale;
            matrixArray[idx16 + 5] = pScale;
            matrixArray[idx16 + 10] = pScale;
            matrixArray[idx16 + 12] = px;
            matrixArray[idx16 + 13] = py;
            matrixArray[idx16 + 14] = pz;

            instColorArray[i * 3] = cr;
            instColorArray[i * 3 + 1] = cg;
            instColorArray[i * 3 + 2] = cb;
          }
          continue;
        }

        // -------------------------------------------------------------
        // State C: Massive Volumetric 3D Floodplain Surge
        // (Full 70m-280m valley width, 14 vertical tiers, surging wave front)
        // -------------------------------------------------------------
        particleState[i] = 1;
        particleAge[i] += dtSim;

        const demInfo = gradientLookupRef.current(px, pz);
        const bedY = demInfo.y;
        const gradX = demInfo.gradX;
        const gradZ = demInfo.gradZ;

        // Downhill Slope Gravity
        const slopeMag = Math.hypot(gradX, gradZ);
        const slopeNorm = Math.sqrt(1.0 + slopeMag * slopeMag);
        const aGravX = -GRAVITY * (gradX / slopeNorm) * 1.5;
        const aGravZ = -GRAVITY * (gradZ / slopeNorm) * 1.8;

        // Broad Valley Flood Corridor Guidance
        const centerlineX = getCanalCenterlineX(pz);
        const halfWidth = getValleyHalfWidth(pz);
        // Each particle naturally occupies its assigned lateral lane across the full flood swath
        const meanderWiggle = Math.sin(pz * 0.04 + now * 0.003 + i * 0.15) * 2.5;
        const targetX = centerlineX + pLateralFrac[i] * (halfWidth * 0.90) + meanderWiggle;
        const lateralDist = targetX - px;
        const aCanalGuidanceX = lateralDist * 3.4;

        // Boundary spring: keep particles firmly within the valley floor
        let aBoundaryX = 0;
        const distFromCenter = Math.abs(px - centerlineX);
        if (distFromCenter > halfWidth) {
          aBoundaryX = -Math.sign(px - centerlineX) * (distFromCenter - halfWidth) * 4.8;
        }

        // Continuous downstream flow momentum down the gorge
        const aDownhillMomentumZ = -18.0 - Math.max(0, -gradZ) * 14.0;

        // SPH Inter-particle Pressure & Viscosity
        let fPressureX = 0;
        let fPressureZ = 0;

        const cx = Math.floor((px - GRID_MIN_X) / CELL_SIZE);
        const cz = Math.floor((pz - GRID_MIN_Z) / CELL_SIZE);
        const pi = pressures[i];
        const rhoi = Math.max(0.2, densities[i]);

        let forceNeighbors = 0;
        if (cx >= 0 && cx < GRID_COLS && cz >= 0 && cz < GRID_ROWS) {
          for (let dz = -1; dz <= 1; dz++) {
            const ncz = cz + dz;
            if (ncz < 0 || ncz >= GRID_ROWS) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const ncx = cx + dx;
              if (ncx < 0 || ncx >= GRID_COLS) continue;
              let j = gridHead[ncz * GRID_COLS + ncx];
              while (j !== -1 && forceNeighbors < 6) {
                if (j !== i) {
                  const djx = px - particlePositions[j * 3];
                  const djz = pz - particlePositions[j * 3 + 2];
                  const r2 = djx * djx + djz * djz;
                  if (r2 < H2 && r2 > 0.01) {
                    const r = Math.sqrt(r2);
                    const spikyGrad = SPIKY_GRAD_COEFF * (SPH_RADIUS - r) * (SPH_RADIUS - r);
                    const nx = djx / r;
                    const nz = djz / r;

                    const rhoj = Math.max(0.2, densities[j]);
                    const rhoBar = 0.5 * (rhoi + rhoj);
                    
                    // Monaghan (1992) Artificial Viscosity Tensor: Pi_ij = (-alpha * c_s * mu_ij) / rhoBar
                    const dvx = vx - velocities[j * 3];
                    const dvz = vz - velocities[j * 3 + 2];
                    const vDotX = dvx * djx + dvz * djz;
                    let pi_ij = 0.0;
                    if (vDotX < 0) {
                      const mu_ij = (SPH_RADIUS * vDotX) / (r2 + 0.01 * H2);
                      pi_ij = (-MONAGHAN_ALPHA * SPEED_OF_SOUND * mu_ij) / rhoBar;
                    }

                    // Combined SPH pressure gradient & artificial shock dissipation
                    const pressureTerm = (pi / (rhoi * rhoi) + pressures[j] / (rhoj * rhoj) + pi_ij);
                    fPressureX -= pressureTerm * spikyGrad * nx * 0.35;
                    fPressureZ -= pressureTerm * spikyGrad * nz * 0.35;

                    forceNeighbors++;
                  }
                }
                j = particleNext[j];
              }
            }
          }
        }

        // Manning Roughness Bed Resistance
        const currentSpeed = Math.hypot(vx, vz);
        const localDepth = Math.max(1.8, densities[i] * 3.8);
        const manningResistance = (GRAVITY * Math.pow(p.manningN, 2) * currentSpeed) / Math.pow(localDepth, 4.0 / 3.0);
        const aFricX = -manningResistance * vx * 1.1;
        const aFricZ = -manningResistance * vz * 1.1;

        const aNetX = aGravX + aCanalGuidanceX + aBoundaryX + fPressureX + aFricX;
        const aNetZ = aGravZ + aDownhillMomentumZ + fPressureZ + aFricZ;

        vx += aNetX * dtPhysics;
        vz += aNetZ * dtPhysics;

        // 3D Volumetric Depth Stacking (14 vertical tiers across the water column)
        const thalwegY = heightLookupRef.current(centerlineX, pz);
        const floodStageDepth = Math.max(7.5, 16.0 - ((246.0 - pz) / 800.0) * 8.0);
        const waterSurfaceY = thalwegY + floodStageDepth;
        const columnDepth = Math.max(2.5, waterSurfaceY - bedY);
        const targetY = bedY + 0.6 + pDepthFrac[i] * columnDepth;

        const aLiftY = (targetY - py) * 6.5;
        vy += (aLiftY - GRAVITY * 0.75) * dtPhysics;
        py += vy * dtPhysics;

        // Riverbed collision
        if (py < bedY + 0.6) {
          py = bedY + 0.6;
          if (currentSpeed > 7.0 && Math.random() > 0.42) {
            vy = Math.min(8.5, currentSpeed * 0.20 + Math.random() * 2.5);
          } else {
            vy = 0;
          }
        }

        // Speed limiting
        const speed = Math.hypot(vx, vz);
        if (speed > 48.0) {
          vx = (vx / speed) * 48.0;
          vz = (vz / speed) * 48.0;
        }

        px += vx * dtPhysics;
        pz += vz * dtPhysics;

        // Wave front bore barrier: cannot outrun surging hydraulic jump
        if (pz < waveFrontZ) {
          pz = waveFrontZ + Math.random() * 3.5;
          vz = -22.0;
          vy = Math.min(10.0, vy + 4.5 + Math.random() * 3.5);
        }

        // Recycle downstream exit particles back into the continuous breach cascade
        if (pz < -565 || px < -240 || px > 260) {
          pz = 244 + Math.random() * 3.0;
          px = 152 + pLateralFrac[i] * Math.max(16.0, breachWidth * 0.85);
          vx = (Math.random() - 0.5) * 4.0;
          vz = -(18.0 + Math.random() * 12.0);
          vy = 2.0 + Math.random() * 4.0;
          particleAge[i] = 0;
        }

        particlePositions[i * 3] = px;
        particlePositions[i * 3 + 1] = py;
        particlePositions[i * 3 + 2] = pz;
        velocities[i * 3] = vx;
        velocities[i * 3 + 1] = vy;
        velocities[i * 3 + 2] = vz;

        if (speed > maxSpeedFound) maxSpeedFound = speed;
        sumSpeed += speed;
        sumDepth += Math.max(0.8, py - bedY);
        activeCount++;
        if (pz < maxFrontZ) maxFrontZ = pz;

        // Deep, rich oceanic aquatic color palette with foaming crests
        const isBoreFront = (pz - waveFrontZ) < 32.0;
        const tier = pDepthFrac[i];
        let cr: number, cg: number, cb: number;

        if (isBoreFront || vy > 3.6 || (speed > 30.0 && Math.random() > 0.52)) {
          // White foaming crest / turbulent rapids / hydraulic bore
          cr = 0.82; cg = 0.92; cb = 1.0;
        } else if (tier > 0.80 || speed > 18.0) {
          // Energetic surface rapids
          cr = 0.08; cg = 0.42; cb = 0.84;
        } else if (tier > 0.38) {
          // Mid-depth torrent
          cr = 0.02; cg = 0.24; cb = 0.64;
        } else {
          // Deep oceanic midnight navy (heavy dense water mass)
          cr = 0.01; cg = 0.12; cb = 0.40;
        }

        particleColors[i * 3] = cr;
        particleColors[i * 3 + 1] = cg;
        particleColors[i * 3 + 2] = cb;

        if (is3dMode) {
          const idx16 = i * 16;
          const stretch = 1.0 + Math.min(0.55, speed * 0.015);
          matrixArray[idx16 + 0] = pScale;
          matrixArray[idx16 + 5] = pScale;
          matrixArray[idx16 + 10] = pScale * stretch;
          matrixArray[idx16 + 12] = px;
          matrixArray[idx16 + 13] = py;
          matrixArray[idx16 + 14] = pz;

          instColorArray[i * 3] = cr;
          instColorArray[i * 3 + 1] = cg;
          instColorArray[i * 3 + 2] = cb;
        }
      }

      if (is3dMode) {
        instancedSpheres.visible = p.showParticles;
        particleSystem.visible = false;
        instancedSpheres.instanceMatrix.needsUpdate = true;
        if (instancedSpheres.instanceColor) instancedSpheres.instanceColor.needsUpdate = true;
      } else {
        instancedSpheres.visible = false;
        particleSystem.visible = p.showParticles;
        particleGeo.attributes.position.needsUpdate = true;
        particleGeo.attributes.color.needsUpdate = true;
      }

      // -------------------------------------------------------------
      // 14. Update Dynamic Continuous Water Surface Mesh (If Toggled ON)
      // -------------------------------------------------------------
      if (waterSurfaceMeshRef.current) {
        const wsMesh = waterSurfaceMeshRef.current;
        wsMesh.visible = p.showWaterSurface && isPostBreak;

        if (wsMesh.visible) {
          const posAttr = wsMesh.geometry.attributes.position as THREE.BufferAttribute;
          const colAttr = wsMesh.geometry.attributes.color as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;
          const colArr = colAttr.array as Float32Array;

          const vertCount = (wsSegX + 1) * (wsSegZ + 1);
          const meshOriginX = wsMesh.position.x;
          const meshOriginZ = wsMesh.position.z;

          for (let idx = 0; idx < vertCount; idx++) {
            const localX = posArr[idx * 3];
            const localZ = posArr[idx * 3 + 2];
            const worldX = localX + meshOriginX;
            const worldZ = localZ + meshOriginZ;

            const bedY = heightLookupRef.current(worldX, worldZ);

            if (worldZ >= maxFrontZ - 8.0 && worldZ <= 250) {
              const cx = Math.floor((worldX - GRID_MIN_X) / CELL_SIZE);
              const cz = Math.floor((worldZ - GRID_MIN_Z) / CELL_SIZE);
              let nearbyFluidCount = 0;

              if (cx >= 0 && cx < GRID_COLS && cz >= 0 && cz < GRID_ROWS) {
                for (let dz = -1; dz <= 1; dz++) {
                  const ncz = cz + dz;
                  if (ncz < 0 || ncz >= GRID_ROWS) continue;
                  for (let dx = -1; dx <= 1; dx++) {
                    const ncx = cx + dx;
                    if (ncx < 0 || ncx >= GRID_COLS) continue;
                    let j = gridHead[ncz * GRID_COLS + ncx];
                    while (j !== -1) {
                      nearbyFluidCount++;
                      j = particleNext[j];
                    }
                  }
                }
              }

              if (nearbyFluidCount > 3) {
                const waterDepth = Math.min(18.0, 1.0 + nearbyFluidCount * 0.18);
                const waveRipple = Math.sin(worldX * 0.12 + now * 0.004) * Math.cos(worldZ * 0.08 + now * 0.003) * 0.45;
                posArr[idx * 3 + 1] = bedY + waterDepth + waveRipple;

                const isFront = (worldZ - maxFrontZ) < 18.0;
                if (isFront) {
                  colArr[idx * 3] = 0.50;
                  colArr[idx * 3 + 1] = 0.75;
                  colArr[idx * 3 + 2] = 0.95;
                } else {
                  colArr[idx * 3] = 0.01;
                  colArr[idx * 3 + 1] = 0.22;
                  colArr[idx * 3 + 2] = 0.52;
                }
              } else {
                posArr[idx * 3 + 1] = bedY - 4.0;
                colArr[idx * 3] = 0.0;
                colArr[idx * 3 + 1] = 0.18;
                colArr[idx * 3 + 2] = 0.40;
              }
            } else {
              posArr[idx * 3 + 1] = bedY - 8.0;
            }
          }

          posAttr.needsUpdate = true;
          colAttr.needsUpdate = true;
          wsMesh.geometry.computeVertexNormals();
        }
      }

      // -------------------------------------------------------------
      // 15. Live Hydrodynamic Telemetry & Froude Calculation (Throttled for 60 FPS)
      // -------------------------------------------------------------
      if (now - lastTelemetryTime > 120 || !p.isPlaying) {
        lastTelemetryTime = now;
        setSimTimeSec(Math.round(p.timeSec * 10) / 10);
        setSimStatus(currentSimStatus);
        setCurrentDischargeM3s(instantDischargeM3s);

        if (isPostBreak && activeCount > 0) {
          const meanSpeed = sumSpeed / activeCount;
          const meanDepth = parseFloat((sumDepth / activeCount).toFixed(1));
          const fr = parseFloat((meanSpeed / Math.sqrt(GRAVITY * Math.max(0.5, meanDepth))).toFixed(2));
          setFroudeNumber(fr);
          setMaxVelocityMs(parseFloat(maxSpeedFound.toFixed(1)));
          setAvgDepthM(meanDepth);

          const frontDist = Math.max(0, Math.round((246 - maxFrontZ) * terrainScale * 0.45));
          setWaveFrontDistM(frontDist);

          let submerged = 0;
          CRITICAL_ASSETS.forEach((asset) => {
            if (frontDist >= asset.thresholdDistM) submerged++;
          });
          setSubmergedAssetsCount(submerged);
        } else {
          setFroudeNumber(0);
          setMaxVelocityMs(0);
          setAvgDepthM(0);
          setWaveFrontDistM(0);
          setSubmergedAssetsCount(0);
        }
      }

      // -------------------------------------------------------------
      // 16. Dynamic Camera Viewpoint Controller
      // -------------------------------------------------------------
      if (cameraRef.current && controlsRef.current) {
        const cam = cameraRef.current;
        const ctrl = controlsRef.current;
        if (p.viewMode === 'AERIAL') {
          cam.position.lerp(new THREE.Vector3(420, 520, 480), 0.04);
          ctrl.target.lerp(new THREE.Vector3(20, 40, -40), 0.04);
        } else if (p.viewMode === 'DAM_CREST') {
          cam.position.lerp(new THREE.Vector3(220, 115, 305), 0.04);
          ctrl.target.lerp(new THREE.Vector3(145, 55, 205), 0.04);
        } else if (p.viewMode === 'DOWNSTREAM_BRIDGE') {
          cam.position.lerp(new THREE.Vector3(88, 88, -65), 0.04);
          ctrl.target.lerp(new THREE.Vector3(37, 48, -106), 0.04);
        } else if (p.viewMode === 'FOLLOW_WAVE') {
          cam.position.lerp(new THREE.Vector3(90, 95, maxFrontZ + 75), 0.05);
          ctrl.target.lerp(new THREE.Vector3(20, 45, maxFrontZ - 30), 0.05);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      controls.dispose();
      delete (window as any).__loadCustomDemTif;
    };
  }, []);

  const handleReset = useCallback(() => {
    simParamsRef.current.timeSec = -30;
    simParamsRef.current.isPlaying = true;
    setIsPlaying(true);
    setSimTimeSec(-30);
    setSimStatus('PRE_BREAK');
    if (resetParticlesRef.current) {
      resetParticlesRef.current();
    }
  }, []);

  const handleStepBreak = useCallback(() => {
    simParamsRef.current.timeSec = 0;
    simParamsRef.current.isPlaying = true;
    setIsPlaying(true);
    setSimTimeSec(0);
    setSimStatus('BREACHING');
  }, []);

  // Global keyboard shortcuts for presentation: Space (play/pause), 1-4 (cameras), M (mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => {
          soundEffects.playClickSound();
          if (!prev) soundEffects.startWaterAmbience();
          else soundEffects.stopWaterAmbience();
          return !prev;
        });
      } else if (e.key === '1') {
        soundEffects.playClickSound();
        setViewMode('AERIAL');
        onNotify?.('Camera View', 'Canyon Birds-Eye Viewpoint', 'info');
      } else if (e.key === '2') {
        soundEffects.playClickSound();
        setViewMode('DAM_CREST');
        onNotify?.('Camera View', 'Dam Crest Overlook Viewpoint', 'info');
      } else if (e.key === '3') {
        soundEffects.playClickSound();
        setViewMode('DOWNSTREAM_BRIDGE');
        onNotify?.('Camera View', 'Gorge Bridge Reach Viewpoint', 'info');
      } else if (e.key === '4') {
        soundEffects.playClickSound();
        setViewMode('FOLLOW_WAVE');
        onNotify?.('Camera View', 'Dynamic Wave Follower Viewpoint', 'info');
      } else if (e.key === 'm' || e.key === 'M') {
        const isMuted = soundEffects.toggleMute();
        onNotify?.('Audio Feedback', isMuted ? 'Sound Effects Muted' : 'Sound Effects Enabled', 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNotify]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      <ThreeControlsOverlay
        simTimeSec={simTimeSec}
        durationMinutes={durationMinutes}
        onDurationChange={onDurationChange}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        simSpeed={simSpeed}
        onSpeedChange={setSimSpeed}
        onReset={handleReset}
        onTriggerBreak={handleStepBreak}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showParticles={showParticles}
        onToggleParticles={() => setShowParticles(!showParticles)}
        showWaterSurface={showWaterSurface}
        onToggleWaterSurface={() => setShowWaterSurface(!showWaterSurface)}
        particleRenderMode={particleRenderMode}
        onParticleRenderModeChange={setParticleRenderMode}
        particleScale={particleScale}
        onParticleScaleChange={setParticleScale}
        simStatus={simStatus}
        submergedAssetsCount={submergedAssetsCount}
        waveFrontDistM={waveFrontDistM}
        demSource={demSource}
        froudeNumber={froudeNumber}
        currentDischargeM3s={currentDischargeM3s}
        maxVelocityMs={maxVelocityMs}
        avgDepthM={avgDepthM}
        manningN={manningN}
        onManningNChange={setManningN}
        simulation={simulation}
        onNotify={onNotify}
        theme={theme}
      />
    </div>
  );
};
