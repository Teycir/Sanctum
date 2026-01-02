'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, Sparkles, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';

export default function Scene() {
    return (
        <div className="fixed inset-0 -z-10 w-full h-full">
            <Canvas
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 2]}
            >
                <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />

                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={1} />

                <Suspense fallback={null}>
                    <Sparkles
                        count={100}
                        scale={12}
                        size={4}
                        speed={0.4}
                        opacity={0.5}
                        color="#00ff9d"
                    />

                    <Environment preset="city" />
                </Suspense>
            </Canvas>
        </div>
    );
}
