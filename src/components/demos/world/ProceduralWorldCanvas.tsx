'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { WorldSceneSpec } from '@/lib/world-assets';
import { mapSceneSpecToRenderablePrimitives } from '@/lib/world-3d';

type Props = {
  sceneSpec: WorldSceneSpec;
  resetToken: number;
  showOverlays: boolean;
};

export function ProceduralWorldCanvas({ sceneSpec, resetToken, showOverlays }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string>('');

  const renderables = useMemo(() => mapSceneSpecToRenderablePrimitives(sceneSpec), [sceneSpec]);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    const prefersFallback = window.innerWidth < 900;
    if (prefersFallback) {
      setFallbackMessage('Desktop interaction recommended. Mobile fallback is active to preserve stability.');
      return;
    }

    const probe = document.createElement('canvas');
    const context = probe.getContext('webgl') || probe.getContext('experimental-webgl');
    if (!context) {
      setFallbackMessage('WebGL unavailable on this device. Showing structured scene metadata fallback.');
      return;
    }

    let mounted = true;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      const THREE = await import('three');
      const controlsModule = await import('three/examples/jsm/controls/OrbitControls.js');
      if (!mounted || !host) return;

      setFallbackMessage('');
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#020617');
      scene.fog = new THREE.Fog('#020617', 60, 140);

      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 250);
      camera.position.set(28, 24, 32);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      host.innerHTML = '';
      host.appendChild(renderer.domElement);

      const controls = new controlsModule.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = true;
      controls.minDistance = 10;
      controls.maxDistance = 75;
      controls.maxPolarAngle = Math.PI / 2.05;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.25;
      controls.target.set(0, 0, 0);
      controls.update();

      const baseGround = new THREE.Mesh(
        new THREE.PlaneGeometry(86, 86),
        new THREE.MeshStandardMaterial({ color: '#070b14', roughness: 1, metalness: 0 })
      );
      baseGround.rotation.x = -Math.PI / 2;
      baseGround.receiveShadow = true;
      scene.add(baseGround);

      const sceneGround = new THREE.Mesh(
        new THREE.PlaneGeometry(76, 76),
        new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.96, metalness: 0.02 })
      );
      sceneGround.rotation.x = -Math.PI / 2;
      sceneGround.position.y = 0.01;
      sceneGround.receiveShadow = true;
      scene.add(sceneGround);

      const grid = new THREE.GridHelper(76, 38, '#1f2937', '#111827');
      const gridMaterial = grid.material as { transparent: boolean; opacity: number };
      gridMaterial.transparent = true;
      gridMaterial.opacity = 0.18;
      grid.position.y = 0.02;
      scene.add(grid);

      for (const primitive of renderables.slice(0, sceneSpec.primitiveBudget)) {
        const geometry = new THREE.BoxGeometry(primitive.size.width, primitive.size.height, primitive.size.depth);
        const material = new THREE.MeshStandardMaterial({
          color: primitive.colorHex,
          roughness:
            primitive.kind === 'corridor'
              ? 0.92
              : primitive.kind === 'structure'
                ? 0.72
                : primitive.kind === 'zone-block'
                  ? 0.8
                  : 0.88,
          metalness: primitive.kind === 'structure' ? 0.1 : 0.03,
          opacity: primitive.opacity,
          transparent: primitive.opacity < 1,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(primitive.position.x, primitive.position.y, primitive.position.z);
        mesh.name = primitive.label;
        mesh.castShadow = primitive.kind !== 'safety-buffer' && primitive.kind !== 'transit-link';
        mesh.receiveShadow = true;
        scene.add(mesh);

        if (showOverlays && primitive.kind === 'safety-buffer') {
          const ring = new THREE.Mesh(
            new THREE.CylinderGeometry((primitive.size.width + primitive.size.depth) / 4, (primitive.size.width + primitive.size.depth) / 4, 0.02, 24),
            new THREE.MeshBasicMaterial({ color: '#a78bfa', transparent: true, opacity: 0.35 })
          );
          ring.position.set(primitive.position.x, 0.03, primitive.position.z);
          scene.add(ring);
        }
      }

      scene.add(new THREE.HemisphereLight('#dbeafe', '#020617', 0.8));
      const keyLight = new THREE.DirectionalLight('#f8fafc', 1.05);
      keyLight.position.set(24, 36, 20);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 120;
      keyLight.shadow.camera.left = -45;
      keyLight.shadow.camera.right = 45;
      keyLight.shadow.camera.top = 45;
      keyLight.shadow.camera.bottom = -45;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight('#93c5fd', 0.34);
      fillLight.position.set(-14, 18, -10);
      scene.add(fillLight);

      const bounds = new THREE.Box3();
      renderables.forEach((primitive) => {
        const min = new THREE.Vector3(
          primitive.position.x - primitive.size.width / 2,
          0,
          primitive.position.z - primitive.size.depth / 2
        );
        const max = new THREE.Vector3(
          primitive.position.x + primitive.size.width / 2,
          primitive.position.y + primitive.size.height / 2,
          primitive.position.z + primitive.size.depth / 2
        );
        bounds.expandByPoint(min);
        bounds.expandByPoint(max);
      });
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const radius = Math.max(size.x, size.z, 14);
      controls.target.copy(center);
      camera.position.set(center.x + radius * 1.05, Math.max(14, size.y * 2.1), center.z + radius * 0.95);
      camera.lookAt(center);
      controls.update();

      const resize = () => {
        if (!host) return;
        const width = Math.max(host.clientWidth, 320);
        const height = Math.max(host.clientHeight, 280);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();

      const observer = new ResizeObserver(resize);
      observer.observe(host);

      let frame = 0;
      const animate = () => {
        frame = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        controls.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        host.innerHTML = '';
      };
    };

    void boot();

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [renderables, resetToken, sceneSpec.primitiveBudget, showOverlays]);

  if (fallbackMessage) {
    return (
      <div
        className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground"
        data-testid="world-3d-fallback"
      >
        {fallbackMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-[360px] overflow-hidden rounded-xl border border-border bg-black/30"
      aria-label="Generated 3D world preview"
      data-testid="world-3d-canvas"
    />
  );
}
