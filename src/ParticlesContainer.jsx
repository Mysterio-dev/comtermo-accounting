import React from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const ParticlesContainer = () => {
  const particlesInit = async (engine) => {
    await loadFull(engine);
  };

  const particlesLoaded = async (container) => {
    console.log(container);
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        fullScreen: false,
        background: {
          color: "#fbfbfb", // Нейтральный светлый фон
        },
        particles: {
          number: { value: 20, density: { enable: true, value_area: 1500 } },
          color: { value: ["#4d4d4d", "#00a1de", "#f97c36"] }, 
          shape: {
            type: "circle",
            stroke: { width: 0, color: "#000000" },
          },
          opacity: {
            value: 0.8,
            random: true,
            anim: {
              enable: false,
              speed: 1,
              opacity_min: 0.1,
              sync: false,
            },
          },
          size: {
            value: 15,
            random: true,
            anim: { enable: true, speed: 1, size_min: 5, sync: false },
          },
          line_linked: {
            enable: false,
          },
          move: {
            enable: true,
            speed: 0.2,
            direction: "random",
            straight: false,
            out_mode: "out",
            bounce: false,
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: { enable: false, mode: "repulse" },
          },
          modes: {
            repulse: { distance: 200, duration: 0.4 },
          },
        },
        retina_detect: true,
      }}
    />
  );
};

export default ParticlesContainer;