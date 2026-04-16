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

      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 250);
      camera.position.set(26, 28, 30);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.innerHTML = '';
      host.appendChild(renderer.domElement);

      const controls = new controlsModule.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = true;
      controls.minDistance = 10;
      controls.maxDistance = 75;
      controls.maxPolarAngle = Math.PI / 2.05;
      controls.target.set(0, 0, 0);
      controls.update();

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(76, 76),
        new THREE.MeshStandardMaterial({ color: '#0b1220', roughness: 1, metalness: 0 })
      );
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      const grid = new THREE.GridHelper(76, 38, '#1f2937', '#111827');
      const gridMaterial = grid.material as { transparent: boolean; opacity: number };
      gridMaterial.transparent = true;
      gridMaterial.opacity = 0.25;
      scene.add(grid);

      for (const primitive of renderables.slice(0, sceneSpec.primitiveBudget)) {
        const geometry = new THREE.BoxGeometry(primitive.size.width, primitive.size.height, primitive.size.depth);
        const material = new THREE.MeshStandardMaterial({
          color: primitive.colorHex,
          roughness: 0.75,
          metalness: primitive.kind === 'structure' ? 0.16 : 0.05,
          opacity: primitive.opacity,
          transparent: primitive.opacity < 1,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(primitive.position.x, primitive.position.y, primitive.position.z);
        mesh.name = primitive.label;
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

      scene.add(new THREE.AmbientLight('#dbeafe', 1.15));
      const keyLight = new THREE.DirectionalLight('#ffffff', 1.2);
      keyLight.position.set(14, 30, 14);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight('#93c5fd', 0.65);
      fillLight.position.set(-12, 20, -8);
      scene.add(fillLight);

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
