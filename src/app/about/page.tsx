"use client";
import React from "react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen max-w-6xl my-4 rounded-[60px] overflow-hidden bg-gray-950 text-white font-mono">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-800 via-pink-700 to-red-700 py-20 px-6 text-center flex flex-col items-center">
        <img
          src="speakgrade_logo.png"
          className="w-30 rounded-full  animate-pulse"
          alt=""
        />
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg"
        >
          About <span className="text-yellow-300">SpeakGrade</span>
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto"
        >
          SpeakGrade helps you improve English conversation skills with
          real-time AI scenarios and interactive exercises.
        </motion.p>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 md:px-20 bg-gray-900 text-center">
        <motion.h2
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-3xl font-bold mb-12 text-blue-400"
        >
          Key Features
        </motion.h2>
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto text-center">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gray-800 p-6 rounded-xl shadow-lg transition"
          >
            <h3 className="text-xl font-semibold mb-2 text-white">
              🎙️ Voice Recognition
            </h3>
            <p className="text-gray-300">
              Practice speaking English naturally in real time.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gray-800 p-6 rounded-xl shadow-lg transition"
          >
            <h3 className="text-xl font-semibold mb-2 text-white">
              🧠 AI Partner
            </h3>
            <p className="text-gray-300">
              Engage in realistic conversations with AI feedback.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gray-800 p-6 rounded-xl shadow-lg transition"
          >
            <h3 className="text-xl font-semibold mb-2 text-white">
              ⏱️ Scenario Challenges
            </h3>
            <p className="text-gray-300">
              Timed exercises to build confidence and fluency.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-6 md:px-20 bg-gray-950 text-center">
        <motion.h2
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-3xl font-bold mb-6 text-purple-400"
        >
          Tech Stack
        </motion.h2>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            "React / Next.js",
            "TailwindCSS",
            "Framer Motion",
            "Web Speech API",
            "OpenAI API",
            "Node.js / Express",
          ].map((tech) => (
            <motion.div
              key={tech}
              whileHover={{ scale: 1.1, y: -3 }}
              className="bg-gray-800 px-4 py-2 rounded-lg shadow text-white font-semibold"
            >
              {tech}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 text-sm text-center py-6 border-t border-gray-800">
        <p>
          &copy; {new Date().getFullYear()} SpeakGrade. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
