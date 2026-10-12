'use client';

import { useEffect, useRef } from 'react';
import type { BufferGeometry, Material, Mesh } from 'three';

/**
 * Ambient 3D scene behind the store hero: softly-lit floating capsules,
 * rings and orbs in brand colours with gentle drift + mouse parallax.
 * Dynamically imports three.js so it never blocks the page bundle.
 */
export default function Hero3D() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const THREE: typeof import('three') = await import('three');
      if (cancelled || !mount.current) return;

      const el = mount.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0, 14);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      el.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.85));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(6, 8, 8);
      scene.add(key);
      const rim = new THREE.PointLight(0x14b8a6, 12, 40);
      rim.position.set(-7, -3, 4);
      scene.add(rim);
      const warm = new THREE.PointLight(0xf85606, 8, 40);
      warm.position.set(7, 4, 2);
      scene.add(warm);

      const mat = (color: number, extra: Record<string, number> = {}) =>
        new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.25, ...extra });

      const shapes: Array<{ mesh: Mesh; baseY: number; speed: number; spin: number; phase: number }> = [];
      const add = (geo: BufferGeometry, material: Material, x: number, y: number, z: number, s: number) => {
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(x, y, z);
        mesh.scale.setScalar(s);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        scene.add(mesh);
        shapes.push({ mesh, baseY: y, speed: 0.35 + Math.random() * 0.5, spin: 0.15 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2 });
      };

      // Medicine capsule (the hero shape)
      add(new THREE.CapsuleGeometry(0.55, 1.5, 8, 24), mat(0xffffff, { roughness: 0.25 }), -5.4, 1.4, -2, 1.15);
      add(new THREE.CapsuleGeometry(0.5, 1.3, 8, 24), mat(0xf85606), 5.6, -1.2, -3, 1.0);
      // Rings
      add(new THREE.TorusGeometry(0.9, 0.28, 20, 48), mat(0x14b8a6), 4.6, 2.2, -4, 1.1);
      add(new THREE.TorusGeometry(0.7, 0.22, 20, 48), mat(0x8b5cf6), -4.4, -2.4, -4.5, 0.9);
      // Orbs
      add(new THREE.SphereGeometry(0.65, 32, 32), mat(0xfbbf24, { roughness: 0.2, metalness: 0.45 }), 2.6, -2.6, -3.5, 1.0);
      add(new THREE.SphereGeometry(0.5, 32, 32), mat(0x38bdf8, { roughness: 0.2, metalness: 0.45 }), -2.4, 2.8, -5, 0.9);
      // Soft icosahedron sparkle
      add(new THREE.IcosahedronGeometry(0.55, 0), mat(0xffffff, { roughness: 0.15, metalness: 0.6 }), 0.4, 3.1, -6, 0.8);

      const resize = () => {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener('resize', resize);

      const mouse = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      };
      window.addEventListener('pointermove', onMove, { passive: true });

      const clock = new THREE.Clock();
      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        const t = clock.getElapsedTime();
        for (const s of shapes) {
          s.mesh.position.y = s.baseY + Math.sin(t * s.speed + s.phase) * 0.45;
          s.mesh.rotation.x += 0.003 * s.spin * 4;
          s.mesh.rotation.y += 0.004 * s.spin * 4;
        }
        camera.position.x += (mouse.x * 1.4 - camera.position.x) * 0.04;
        camera.position.y += (-mouse.y * 1.0 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', onMove);
        scene.traverse((o) => {
          const m = o as Mesh;
          if (m.geometry) m.geometry.dispose();
          const mm = m.material as Material | undefined;
          if (mm) mm.dispose();
        });
        renderer.dispose();
        el.removeChild(renderer.domElement);
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <div ref={mount} className="hero3d-mount" aria-hidden="true" />;
}
