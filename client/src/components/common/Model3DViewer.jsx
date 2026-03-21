import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const loadFBXLoader = async () => {
  return FBXLoader;
};

const Model3DViewer = ({ modelUrl, width = '100%', height = '400px' }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !modelUrl) {
      setError('No model URL provided');
      setLoading(false);
      return;
    }

    if (modelUrl.includes('res.cloudinary.com/demo/raw/upload')) {
      setError('Invalid 3D model URL: demo placeholder URL not supported. Upload a real model.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const cleanScene = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const renderer = rendererRef.current;
      if (renderer) {
        if (renderer.domElement && renderer.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
        rendererRef.current = null;
      }

      const scene = sceneRef.current;
      if (scene) {
        // Dispose geometry/materials if possible
        scene.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
        sceneRef.current = null;
      }

      window.removeEventListener('resize', onWindowResize);
    };

    const onWindowResize = () => {
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const init = async () => {
      setLoading(true);
      setError(null);

      try {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5);
        sceneRef.current = scene;

        const width_val = containerRef.current.clientWidth;
        const height_val = containerRef.current.clientHeight;
        const camera = new THREE.PerspectiveCamera(75, width_val / height_val, 0.1, 1000);
        camera.position.set(0, 0, 5);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width_val, height_val);
        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;

        containerRef.current.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(5, 10, 7);
        scene.add(directionalLight);

        const FBXLoaderConstructor = await loadFBXLoader();
        if (!FBXLoaderConstructor) {
          throw new Error('FBXLoader not available (dependency or fallback failed)');
        }

        const loader = new FBXLoaderConstructor();
        loader.load(
          modelUrl,
          (object) => {
            if (!isMounted) return;

            object.scale.set(0.01, 0.01, 0.01);
            scene.add(object);
            setLoading(false);

            const animate = () => {
              if (!isMounted) return;
              object.rotation.y += 0.005;
              renderer.render(scene, camera);
              animationFrameRef.current = requestAnimationFrame(animate);
            };

            animate();
          },
          undefined,
          (err) => {
            console.error('Error loading FBX model:', err);
            if (!isMounted) return;
            setError('Failed to load 3D model file');
            setLoading(false);
          }
        );

        window.addEventListener('resize', onWindowResize);
      } catch (sceneError) {
        console.error('Scene initialization error:', sceneError);
        if (!isMounted) return;
        setError('Failed to initialize 3D viewer');
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      cleanScene();
    };
  }, [modelUrl]);

  return (
    <div ref={containerRef} style={{ width, height, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#666', margin: 0 }}>Loading 3D model...</p>
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          textAlign: 'center',
          color: '#d32f2f',
          padding: '2rem'
        }}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Model3DViewer;

