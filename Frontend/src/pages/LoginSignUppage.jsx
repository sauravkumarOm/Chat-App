import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { motion } from "framer-motion";
import Login from "../Components/Login";
import SignUp from "../Components/SignUp";

const Chat3D = () => {
    const { scene } = useGLTF("/assets/scene.gltf");
    return <primitive object={scene} scale={0.39} position={[0, -0.7, 0]} />;
};

const LoginSignup = () => {
    const [isSignup, setIsSignup] = useState(false); // State to toggle between Login & Signup

    useEffect(() => {
        const canvas = document.getElementById("particleCanvas");
        const ctx = canvas.getContext("2d");

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const numParticles = 100;
        const colors = ["#FF5733", "#FFBD33", "#33FF57", "#3383FF", "#A833FF"];

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.radius = Math.random() * 5 + 2;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = (Math.random() - 0.5) * 2;
            }

            move() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x <= 0 || this.x >= canvas.width) this.vx *= -1;
                if (this.y <= 0 || this.y >= canvas.height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        function initParticles() {
            for (let i = 0; i < numParticles; i++) {
                particles.push(new Particle());
            }
        }

        function getClosest(particle) {
            return [...particles]
                .map(p => ({ p, d: Math.hypot(p.x - particle.x, p.y - particle.y) }))
                .sort((a, b) => a.d - b.d)
                .slice(1, 2)
                .map(p => p.p)[0];
        }

        function drawLines() {
            particles.forEach(p => {
                const closest = getClosest(p);
                if (!closest) return;

                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(closest.x, closest.y);

                const gradient = ctx.createLinearGradient(p.x, p.y, closest.x, closest.y);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, closest.color);

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawLines();
            particles.forEach(p => {
                p.move();
                p.draw();
            });
            requestAnimationFrame(animate);
        }

        initParticles();
        animate();

        window.addEventListener("resize", () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles.length = 0;
            initParticles();
        });

        return () => window.removeEventListener("resize", () => {});
    }, []);

    return (
        <div className="relative w-screen min-h-screen flex flex-col items-center justify-center p-4">
            {/* Background Canvas */}
            <canvas id="particleCanvas" className="absolute top-0 left-0 w-full h-full"></canvas>

            {/* Top Section: Welcome Text */}
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="text-6xl font-bold text-red-600 mb-6 relative z-10"
            >
                Welcome to Chat App
            </motion.h1>

            {/* Bottom Section: Left (3D Model) & Right (Login/SignUp Form) */}
            <div className="flex w-full max-w-6xl h-[80vh] relative z-10">
                {/* Left Section: 3D Canvas */}
                <div className="w-1/2 h-full flex items-center justify-center">
                    <div className="rounded-xl h-full w-full overflow-hidden flex items-center justify-center">
                        <Canvas camera={{ position: [0, 1, 5], fov: 45 }}>
                            <ambientLight intensity={1} />
                            <directionalLight position={[2, 2, 2]} />
                            <Chat3D />
                            <OrbitControls enableZoom={false} />
                        </Canvas>
                    </div>
                </div>

                {/* Right Section: Login/SignUp Form */}
                <div className="w-1/2 flex items-center justify-center">
                    {isSignup ? (
                        <SignUp toggleForm={() => setIsSignup(false)} />
                    ) : (
                        <Login toggleForm={() => setIsSignup(true)} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginSignup;
