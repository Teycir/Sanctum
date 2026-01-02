'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

export function PremiumObject() {
    const meshRef = useRef<THREE.Mesh>(null);
    const innerRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
        }
        if (innerRef.current) {
            innerRef.current.rotation.x = -state.clock.getElapsedTime() * 0.1;
            innerRef.current.rotation.y = -state.clock.getElapsedTime() * 0.2;
        }
    });

    return (
        <Float
            speed={1.5} // Animation speed, defaults to 1
            rotationIntensity={1} // XYZ rotation intensity, defaults to 1
            floatIntensity={2} // Up/down float intensity, defaults to 1
        >
            <group>
                {/* Outer Glass Shell */}
                <mesh ref={meshRef} scale={2}>
                    <icosahedronGeometry args={[1, 0]} />
                    <MeshTransmissionMaterial
                        backside
                        samples={16}
                        thickness={2}
                        chromaticAberration={0.05}
                        anisotropy={1}
                        distortion={1}
                        distortionScale={1}
                        temporalDistortion={0.2}
                        iridescence={1}
                        iridescenceIOR={1}
                        iridescenceThicknessRange={[0, 1400]}
                        roughness={0.1}
                        clearcoat={1}
                        color="#ffffff" // Base color, maybe a slight tint if needed
                    />
                </mesh>

                {/* Inner Wireframe Core */}
                <mesh ref={innerRef} scale={1.2}>
                    <dodecahedronGeometry args={[1, 0]} />
                    <meshBasicMaterial color="#00ff9d" wireframe transparent opacity={0.3} />
                </mesh>

                {/* Glow halo */}
                <pointLight intensity={2} color="#00ff9d" distance={5} decay={2} />
            </group>
        </Float>
    );
}
