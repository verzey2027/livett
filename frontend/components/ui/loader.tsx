import React from "react"

export function Loader({ className, size = "default" }: { className?: string; size?: "small" | "default" }) {
  const scaleClass = size === "small" ? "loader-sm" : "loader-default"
  
  return (
    <div className={`loader-wrapper ${scaleClass} ${className || ""}`}>
      <div className="loader">
        <div className="box box-1">
          <div className="side-left" />
          <div className="side-right" />
          <div className="side-top" />
        </div>
        <div className="box box-2">
          <div className="side-left" />
          <div className="side-right" />
          <div className="side-top" />
        </div>
        <div className="box box-3">
          <div className="side-left" />
          <div className="side-right" />
          <div className="side-top" />
        </div>
        <div className="box box-4">
          <div className="side-left" />
          <div className="side-right" />
          <div className="side-top" />
        </div>
      </div>
    </div>
  )
}

