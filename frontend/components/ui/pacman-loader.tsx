"use client"

import React from 'react'

export default function PacmanLoader() {
  return (
    <div className="pacman-loader-wrapper">
      <main id="container">
        <div className="dots">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
        <div className="dots2">
          <div className="dot2" />
          <div className="dot2" />
          <div className="dot2" />
          <div className="dot2" />
          <div className="dot2" />
          <div className="dot2" />
          <div className="dot2" />
          <div className="dot2" />
          <div className="dot2" />
          <div className="dot2" />
        </div>
        <div className="circle" />
      </main>
    </div>
  )
}

