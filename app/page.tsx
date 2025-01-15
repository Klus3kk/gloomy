"use client";
import React, { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const canvas = document.getElementById("particles") as HTMLCanvasElement;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      let particlesArray: {
        x: number;
        y: number;
        size: number;
        speedX: number;
        speedY: number;
      }[] = [];
      let canvasWidth = canvas.width;
      let canvasHeight = canvas.height;

      const updateCanvasSize = () => {
        canvasWidth = canvas.width = window.innerWidth;
        canvasHeight = canvas.height = window.innerHeight;
        particlesArray = [];
        createParticles();
      };

      const createParticles = () => {
        for (let i = 0; i < 100; i++) {
          particlesArray.push({
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            size: Math.random() * 3 + 1,
            speedX: Math.random() * 1 - 0.5,
            speedY: Math.random() * 1 - 0.5,
          });
        }
      };

      const animateParticles = () => {
        ctx!.clearRect(0, 0, canvasWidth, canvasHeight);
        particlesArray.forEach((particle) => {
          particle.x += particle.speedX * 0.5;
          particle.y += particle.speedY * 0.5;

          if (particle.x > canvasWidth) particle.x = 0;
          if (particle.x < 0) particle.x = canvasWidth;
          if (particle.y > canvasHeight) particle.y = 0;
          if (particle.y < 0) particle.y = canvasHeight;

          ctx!.beginPath();
          ctx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx!.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx!.fill();
        });
        requestAnimationFrame(animateParticles);
      };

      updateCanvasSize();
      createParticles();
      animateParticles();

      window.addEventListener("resize", updateCanvasSize);

      return () => {
        window.removeEventListener("resize", updateCanvasSize);
      };
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section
        className="relative flex-grow flex items-center justify-center text-center text-white min-h-screen"
        style={{
          backgroundImage: "url('/wallpaper.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Particle Canvas */}
        <canvas
          id="particles"
          className="absolute inset-0 z-0 pointer-events-none"
        ></canvas>
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 z-5"></div>
        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl px-4 text-center">
          <h1 className="text-6xl font-extrabold mb-4 drop-shadow-lg">
            Welcome to Gloomy
          </h1>
          <p className="text-xl drop-shadow-md">
            Your trusted platform for secure and organized file downloads.
          </p>
        </div>
      </section>
    </div>
  );
  
}
