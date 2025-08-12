'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, OrbitControls, Environment } from '@react-three/drei';
import './orb.css'; // Import your custom CSS for the orb
import * as THREE from 'three';

interface SpeakingOrbProps {
    isSpeaking: boolean;
}

const AnimatedOrb: React.FC<{ isSpeaking: boolean }> = ({ isSpeaking }) => {
    const materialRef = useRef<any>(null);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (materialRef.current) {
            materialRef.current.distort = isSpeaking ? 0.4 : 0.15;
            materialRef.current.speed = isSpeaking ? 4 : 1;
            materialRef.current.time = t;
        }
    });

    return (
        <Sphere args={[1, 64, 64]} scale={2}>
            <MeshDistortMaterial
                ref={materialRef}
                color="#1a1a1a"
                emissive="#220044"
                emissiveIntensity={0.3}

                attach="material"
                distort={0.3}
                speed={3}
                roughness={0.4}
            />

        </Sphere>
    );
};

const SpeakingOrb: React.FC<SpeakingOrbProps> = ({ isSpeaking }) => {
    return (
        <div className="w-full h-[350px] lg:h-[400px] ">
            <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
                <ambientLight intensity={0.6} />
                <pointLight position={[5, 5, 5]} intensity={1} />
                <AnimatedOrb isSpeaking={isSpeaking} />
                <Environment preset="night" />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={isSpeaking ? 1.5 : 0.5} />
            </Canvas>
        </div>
    );
};

export default SpeakingOrb;
