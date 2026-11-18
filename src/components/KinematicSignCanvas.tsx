import React, { useEffect, useState } from 'react';
import type { KinematicKeyframe } from '../types/signbridge';

interface KinematicSignCanvasProps {
  pose: KinematicKeyframe;
  labelAr: string;
  subLabelAr?: string;
  animate?: boolean;
  darkBg?: boolean;
  heightClass?: string;
}

export const KinematicSignCanvas: React.FC<KinematicSignCanvasProps> = ({
  pose,
  labelAr,
  subLabelAr,
  animate = true,
  heightClass = 'h-56',
}) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!animate) {
      setPhase(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = ((now - start) % 2400) / 2400;
      setPhase(Math.sin(t * Math.PI * 2) * 0.5 + 0.5);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, pose]);

  const W = 320;
  const H = 220;

  const rBaseX = pose.rightHand.x * W;
  const rBaseY = pose.rightHand.y * H;
  const rCurX = rBaseX + pose.rightHand.dx * W * (phase - 0.35);
  const rCurY = rBaseY + pose.rightHand.dy * H * (phase - 0.35);

  const lBaseX = pose.leftHand.x * W;
  const lBaseY = pose.leftHand.y * H;
  const lCurX = lBaseX + pose.leftHand.dx * W * (phase - 0.35);
  const lCurY = lBaseY + pose.leftHand.dy * H * (phase - 0.35);

  const shoulderY = 104 - pose.shoulderLift * 18;
  const rShoulderX = 122;
  const lShoulderX = 198;
  const rElbowX = (rShoulderX + rCurX) * 0.5 - 16;
  const rElbowY = Math.max(shoulderY + 26, (shoulderY + rCurY) * 0.5 + 14);
  const lElbowX = (lShoulderX + lCurX) * 0.5 + 16;
  const lElbowY = Math.max(shoulderY + 26, (shoulderY + lCurY) * 0.5 + 14);

  const strokePrimary = '#00f5d4';
  const strokePose = '#38bdf8';
  const strokeFuchsia = '#e879f9';
  const strokeMuted = 'rgba(148,163,184,0.28)';
  const nodeFill = '#07090f';

  return (
    <div
      className={`relative w-full ${heightClass} rounded-xl border border-cyan-500/25 bg-[#060913] text-slate-100 overflow-hidden select-none`}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        role="img"
        aria-label={`تمثيل حركي لإشارة ${labelAr}`}
      >
        <defs>
          <pattern id="kinematic-grid-neon" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="rgba(34,211,238,0.08)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#kinematic-grid-neon)" />

        {/* Torso & Shoulders */}
        <path
          d={`M ${rShoulderX} ${shoulderY} L ${lShoulderX} ${shoulderY} L ${lShoulderX - 10} 205 L ${rShoulderX + 10} 205 Z`}
          fill="rgba(15,23,42,0.75)"
          stroke="rgba(56,189,248,0.25)"
          strokeWidth="1.4"
        />

        {/* Head & Facial Landmark Contour */}
        <g transform={`rotate(${pose.headTiltDeg} 160 60)`}>
          <ellipse
            cx="160"
            cy="56"
            rx="24"
            ry="29"
            fill="#07090f"
            stroke={strokePose}
            strokeWidth="1.8"
          />
          <path
            d={`M 146 ${46 - pose.browRaise * 5} Q 151 ${43 - pose.browRaise * 6} 156 ${46 - pose.browRaise * 5}`}
            fill="none"
            stroke={strokeFuchsia}
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d={`M 164 ${46 - pose.browRaise * 5} Q 169 ${43 - pose.browRaise * 6} 174 ${46 - pose.browRaise * 5}`}
            fill="none"
            stroke={strokeFuchsia}
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <circle cx="151" cy="52" r="2.1" fill={strokePrimary} />
          <circle cx="169" cy="52" r="2.1" fill={strokePrimary} />
          <path
            d="M 153 68 Q 160 72 167 68"
            fill="none"
            stroke={strokeFuchsia}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </g>

        {/* Neck & Shoulder line */}
        <line x1="160" y1="85" x2="160" y2={shoulderY} stroke={strokePose} strokeWidth="2" />
        <line
          x1={rShoulderX}
          y1={shoulderY}
          x2={lShoulderX}
          y2={shoulderY}
          stroke={strokePose}
          strokeWidth="2.4"
        />

        {/* Right Arm Kinematic Chain */}
        <polyline
          points={`${rShoulderX},${shoulderY} ${rElbowX},${rElbowY} ${rCurX},${rCurY}`}
          fill="none"
          stroke={strokePose}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={rShoulderX} cy={shoulderY} r="4" fill={nodeFill} stroke={strokePose} strokeWidth="2" />
        <circle cx={rElbowX} cy={rElbowY} r="3.5" fill={nodeFill} stroke={strokePose} strokeWidth="2" />

        {/* Left Arm Kinematic Chain */}
        <polyline
          points={`${lShoulderX},${shoulderY} ${lElbowX},${lElbowY} ${lCurX},${lCurY}`}
          fill="none"
          stroke={pose.leftHand.active ? strokeFuchsia : strokeMuted}
          strokeWidth={pose.leftHand.active ? '2.4' : '1.5'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lShoulderX} cy={shoulderY} r="4" fill={nodeFill} stroke={strokePose} strokeWidth="2" />
        <circle cx={lElbowX} cy={lElbowY} r="3.5" fill={nodeFill} stroke={strokePose} strokeWidth="2" />

        {/* Right Hand Motion Vector Trail */}
        {(Math.abs(pose.rightHand.dx) > 0.01 || Math.abs(pose.rightHand.dy) > 0.01) && (
          <line
            x1={rBaseX - pose.rightHand.dx * W * 0.35}
            y1={rBaseY - pose.rightHand.dy * H * 0.35}
            x2={rBaseX + pose.rightHand.dx * W * 0.65}
            y2={rBaseY + pose.rightHand.dy * H * 0.65}
            stroke={strokePrimary}
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        )}

        {/* Right Hand Finger Keypoints */}
        <g transform={`translate(${rCurX}, ${rCurY})`}>
          {[-10, -5, 0, 5, 10].map((fx, idx) => {
            const spread = 0.4 + pose.rightHand.openness * 0.9;
            const fy = -11 - (idx === 2 ? 4 : idx === 0 ? -4 : 0) * spread;
            return (
              <g key={idx}>
                <line
                  x1="0"
                  y1="0"
                  x2={fx * spread}
                  y2={fy}
                  stroke={strokePrimary}
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
                <circle cx={fx * spread} cy={fy} r="2.4" fill={strokePrimary} />
              </g>
            );
          })}
          <circle cx="0" cy="0" r="4.6" fill={nodeFill} stroke={strokePrimary} strokeWidth="2.2" />
        </g>

        {/* Left Hand Finger Keypoints */}
        <g transform={`translate(${lCurX}, ${lCurY})`} opacity={pose.leftHand.active ? 1 : 0.35}>
          {[-9, -4, 0, 4, 9].map((fx, idx) => {
            const spread = 0.4 + pose.leftHand.openness * 0.9;
            const fy = -10 - (idx === 2 ? 3 : 0) * spread;
            return (
              <g key={idx}>
                <line
                  x1="0"
                  y1="0"
                  x2={fx * spread}
                  y2={fy}
                  stroke={pose.leftHand.active ? strokeFuchsia : strokeMuted}
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
                <circle
                  cx={fx * spread}
                  cy={fy}
                  r="2.1"
                  fill={pose.leftHand.active ? strokeFuchsia : strokeMuted}
                />
              </g>
            );
          })}
          <circle
            cx="0"
            cy="0"
            r="4.2"
            fill={nodeFill}
            stroke={pose.leftHand.active ? strokeFuchsia : strokeMuted}
            strokeWidth="2"
          />
        </g>
      </svg>

      <div className="absolute bottom-2.5 right-3 left-3 flex items-center justify-between text-xs text-cyan-200 pointer-events-none">
        <span className="font-semibold">{labelAr}</span>
        {subLabelAr && <span className="font-mono-tabular text-[11px] text-slate-300">{subLabelAr}</span>}
      </div>
    </div>
  );
};
