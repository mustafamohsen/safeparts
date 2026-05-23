import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

const S = (seconds: number) => Math.round(seconds * FPS);

const SCENES = [
  { id: "intro", duration: S(45) },
  { id: "threshold", duration: S(85) },
  { id: "audience", duration: S(85) },
  { id: "interfaces", duration: S(70) },
  { id: "not", duration: S(70) },
  { id: "split", duration: S(95) },
  { id: "math", duration: S(135) },
  { id: "combine", duration: S(80) },
  { id: "encodings", duration: S(80) },
  { id: "stories", duration: S(80) },
  { id: "closing", duration: S(55) },
] as const;

export const TOTAL_FRAMES = SCENES.reduce((sum, scene) => sum + scene.duration, 0);

type SceneProps = { duration: number };
type Point = { x: number; y: number };

type Beat = {
  label: string;
  detail?: string;
};

const emerald = "#2FE7B8";
const emerald2 = "#12D6A5";
const cyan = "#84F6FF";
const amber = "#FFD166";
const rose = "#FF5C8A";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);
const popEase = Easing.bezier(0.34, 1.56, 0.64, 1);

const lerp = (frame: number, input: [number, number], output: [number, number], easing = easeOut) =>
  interpolate(frame, input, output, { ...clamp, easing });

const fade = (frame: number, start: number, end: number) => lerp(frame, [start, end], [0, 1]);

const sceneOpacity = (frame: number, duration: number) => {
  const inOpacity = fade(frame, 0, 36);
  const outOpacity = interpolate(frame, [duration - 38, duration - 1], [1, 0], clamp);
  return Math.min(inOpacity, outOpacity);
};

const formatTime = (frame: number) => {
  const totalSeconds = Math.floor(frame / FPS);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const currentBeat = (frame: number, duration: number, beats: Beat[]) => {
  const index = Math.min(beats.length - 1, Math.floor((frame / duration) * beats.length));
  return beats[index];
};

const Background = ({ tone = "green" }: { tone?: "green" | "red" | "blue" }) => {
  const frame = useCurrentFrame();
  const drift = frame * 0.18;
  const hue = tone === "red" ? "rgba(255,92,138," : tone === "blue" ? "rgba(132,246,255," : "rgba(47,231,184,";

  return (
    <AbsoluteFill className="bg-root">
      <div
        className="aurora aurora-a"
        style={{
          transform: `translate3d(${Math.sin(frame / 90) * 42}px, ${Math.cos(frame / 120) * 28}px, 0) rotate(${frame / 260}deg)`,
          background: `radial-gradient(circle, ${hue}0.28) 0%, rgba(0,0,0,0) 62%)`,
        }}
      />
      <div
        className="aurora aurora-b"
        style={{
          transform: `translate3d(${Math.cos(frame / 130) * -56}px, ${Math.sin(frame / 110) * 44}px, 0) rotate(${-frame / 320}deg)`,
        }}
      />
      <div
        className="grid-layer"
        style={{ backgroundPosition: `${drift}px ${drift * 0.65}px` }}
      />
      <div
        className="scan-layer"
        style={{ transform: `translateY(${(frame * 3) % 64}px)` }}
      />
      <div className="vignette" />
    </AbsoluteFill>
  );
};

const SceneChrome = ({
  title,
  eyebrow,
  frame,
  duration,
  beats,
  children,
  tone = "green",
}: {
  title: string;
  eyebrow: string;
  frame: number;
  duration: number;
  beats: Beat[];
  children: React.ReactNode;
  tone?: "green" | "red" | "blue";
}) => {
  const beat = currentBeat(frame, duration, beats);
  const opacity = sceneOpacity(frame, duration);
  const titleY = lerp(frame, [4, 42], [30, 0]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <Background tone={tone} />
      <div className="safe-frame" />
      <div className="topbar">
        <div className="brand-lockup">
          <Img src={staticFile("logo.svg")} className="brand-logo" />
          <div>
            <div className="brand-name">Safeparts</div>
            <div className="brand-sub">threshold recovery explainer · v0.7</div>
          </div>
        </div>
        <div className="timecode">{formatTime(frame)}</div>
      </div>

      <div className="scene-title" style={{ transform: `translateY(${titleY}px)` }}>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>

      {children}

      <div className="narration-ribbon">
        <div className="ribbon-dot" />
        <div>
          <div className="ribbon-label">{beat.label}</div>
          {beat.detail ? <div className="ribbon-detail">{beat.detail}</div> : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const LockGlyph = ({ className = "", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id="lockBody" x1="16" y1="24" x2="50" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#06231d" />
        <stop offset="1" stopColor="#010b09" />
      </linearGradient>
      <linearGradient id="lockShackle" x1="18" y1="5" x2="46" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#eafff8" />
        <stop offset="0.45" stopColor="#86ffe4" />
        <stop offset="1" stopColor="#2fe7b8" />
      </linearGradient>
    </defs>
    <path
      d="M20 27v-7c0-7.2 5.1-12.5 12-12.5S44 12.8 44 20v7"
      fill="none"
      stroke="url(#lockShackle)"
      strokeWidth="7"
      strokeLinecap="round"
    />
    <rect
      x="14"
      y="25"
      width="36"
      height="31"
      rx="10"
      fill="url(#lockBody)"
      stroke="#b9fff0"
      strokeWidth="3"
    />
    <path
      d="M32 36.5a5.2 5.2 0 0 0-2.3 9.9v4.1h4.6v-4.1A5.2 5.2 0 0 0 32 36.5Z"
      fill="#2fe7b8"
    />
    <path d="M18 31h28" stroke="rgba(234,255,248,.26)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SecretCore = ({
  x,
  y,
  scale = 1,
  label,
  danger = false,
  pulse = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  label?: string;
  danger?: boolean;
  pulse?: number;
}) => (
  <div
    className={`secret-core ${danger ? "secret-core-danger" : ""}`}
    style={{
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale + Math.sin(pulse / 16) * 0.025})`,
    }}
  >
    <div className="core-orbit core-orbit-a" />
    <div className="core-orbit core-orbit-b" />
    <LockGlyph className="core-lock" />
    {label ? <div className="core-label">{label}</div> : null}
  </div>
);

const ShareNode = ({
  x,
  y,
  index,
  active = true,
  label,
  scale = 1,
  hue = emerald,
}: {
  x: number;
  y: number;
  index: number;
  active?: boolean;
  label?: string;
  scale?: number;
  hue?: string;
}) => (
  <div
    className={`share-node ${active ? "" : "share-node-muted"}`}
    style={{
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale})`,
      ["--node-color" as string]: hue,
    }}
  >
    <div className="share-index">{index}</div>
    <div className="share-noise">
      {Array.from({ length: 18 }).map((_, i) => (
        <span key={i} style={{ opacity: 0.18 + ((i * 17) % 40) / 100 }}>
          {i % 3 === 0 ? "·" : i % 3 === 1 ? "×" : "•"}
        </span>
      ))}
    </div>
    {label ? <div className="share-label">{label}</div> : null}
  </div>
);

const FailureRing = ({ x, y, label, delay, frame }: { x: number; y: number; label: string; delay: number; frame: number }) => {
  const p = fade(frame, delay, delay + 28);
  const exit = interpolate(frame, [760, 900], [1, 0], clamp);
  const scale = interpolate(p, [0, 1], [0.5, 1]);
  return (
    <div className="failure-site" style={{ left: x, top: y, opacity: p * exit, transform: `translate(-50%, -50%) scale(${scale})` }}>
      <div className="failure-ring" />
      <div className="failure-icon">{label}</div>
      <div className="failure-caption">single point</div>
    </div>
  );
};

const IntroScene = ({ duration }: SceneProps) => {
  const frame = useCurrentFrame();
  const splitP = fade(frame, 780, 980);
  const dangerP = fade(frame, 110, 260);
  const coreScale = interpolate(frame, [0, 90, 760, 980], [0.75, 1, 1, 0.55], { ...clamp, easing: easeOut });
  const nodes = [
    { x: 560, y: 700, label: "person" },
    { x: 960, y: 750, label: "offline" },
    { x: 1360, y: 700, label: "vault" },
  ];

  return (
    <SceneChrome
      eyebrow="01 / the problem"
      title="One recovery key needs a careful home"
      frame={frame}
      duration={duration}
      beats={[
        { label: "A recovery key is powerful because it can save you." },
        { label: "One copy can become the whole attack surface." },
        { label: "Safeparts lets recovery depend on a threshold you choose." },
      ]}
    >
      <div className="intro-stage">
        <SecretCore x={960} y={510} scale={coreScale} label="recovery key" danger={dangerP > 0.4} pulse={frame} />

        <FailureRing x={475} y={345} label="laptop" delay={120} frame={frame} />
        <FailureRing x={1425} y={345} label="cloud" delay={190} frame={frame} />
        <FailureRing x={475} y={725} label="safe" delay={260} frame={frame} />
        <FailureRing x={1425} y={725} label="person" delay={330} frame={frame} />

        <svg className="connection-svg" viewBox="0 0 1920 1080">
          {nodes.map((node, i) => {
            const p = Math.max(0, splitP - i * 0.12) / 0.88;
            const opacity = Math.max(0, Math.min(1, p));
            return (
              <path
                key={node.label}
                d={`M 960 510 Q ${(960 + node.x) / 2} ${320 + i * 80} ${node.x} ${node.y}`}
                stroke={emerald}
                strokeWidth="3"
                opacity={opacity * 0.55}
                fill="none"
                strokeDasharray="10 18"
              />
            );
          })}
        </svg>

        {nodes.map((node, i) => {
          const p = fade(frame, 900 + i * 24, 980 + i * 24);
          return <ShareNode key={node.label} x={node.x} y={node.y} index={i + 1} label={node.label} scale={p} />;
        })}

        <div className="big-formula" style={{ opacity: fade(frame, 990, 1080) }}>
          k-of-n recovery
        </div>
      </div>
    </SceneChrome>
  );
};

const ThresholdGate = ({ frame }: { frame: number }) => {
  const share1 = fade(frame, 210, 280);
  const share2 = fade(frame, 430, 500);
  const open = fade(frame, 530, 620);
  return (
    <div className="threshold-gate">
      <div className="gate-label">2 of 3</div>
      <div className="gate-slots">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`gate-slot ${i === 0 && share1 > 0.9 ? "lit" : ""} ${i === 1 && share2 > 0.9 ? "lit" : ""}`} />
        ))}
      </div>
      <div className="gate-doors">
        <div className="gate-door" style={{ transform: `translateX(${-open * 115}px)` }} />
        <div className="gate-door" style={{ transform: `translateX(${open * 115}px)` }} />
      </div>
      <LockGlyph className="gate-secret" style={{ opacity: open, transform: `translate(-50%, -50%) scale(${open})` }} />
    </div>
  );
};

const ThresholdScene = ({ duration }: SceneProps) => {
  const frame = useCurrentFrame();
  const ghost = fade(frame, 90, 210) * interpolate(frame, [430, 560], [1, 0], clamp);
  const snap = fade(frame, 530, 650);

  return (
    <SceneChrome
      eyebrow="02 / mental model"
      title="A share is a point in a larger pattern"
      frame={frame}
      duration={duration}
      beats={[
        { label: "n is the number of shares you create." },
        { label: "k is the number required for recovery." },
        { label: "Fewer than k shares leave too many possible secrets." },
        { label: "Any k shares from the same set reconstruct the original." },
      ]}
    >
      <div className="threshold-stage">
        <div className="split-equation">
          <span>secret</span>
          <span className="arrow">→</span>
          <span>3 shares</span>
          <span className="arrow">→</span>
          <span>any 2 recover</span>
        </div>

        <ShareNode x={370} y={420} index={1} label="share A" scale={fade(frame, 30, 90)} />
        <ShareNode x={370} y={585} index={2} label="share B" scale={fade(frame, 70, 130)} />
        <ShareNode x={370} y={750} index={3} label="share C" scale={fade(frame, 110, 170)} />

        <svg className="connection-svg" viewBox="0 0 1920 1080">
          <path d="M 430 420 C 690 390 850 440 1135 540" stroke={emerald} strokeWidth="4" opacity={fade(frame, 430, 560) * 0.48} fill="none" strokeDasharray="18 16" />
          <path d="M 430 585 C 705 585 860 600 1135 590" stroke={emerald} strokeWidth="4" opacity={fade(frame, 430, 560) * 0.48} fill="none" strokeDasharray="18 16" />
        </svg>

        <div className="ghost-secrets" style={{ opacity: ghost }}>
          {Array.from({ length: 11 }).map((_, i) => (
            <div
              key={i}
              className="ghost-secret"
              style={{
                left: 720 + (i % 4) * 86,
                top: 410 + Math.floor(i / 4) * 92,
                transform: `rotate(${(i - 5) * 7}deg)`,
              }}
            >
              ?
            </div>
          ))}
          <div className="ghost-caption">one share: too many possible secrets</div>
        </div>

        <ThresholdGate frame={frame} />

        <div className="recovered-panel" style={{ opacity: snap }}>
          <div className="recovered-title">threshold met</div>
          <div className="recovered-key">original secret reconstructed</div>
        </div>
      </div>
    </SceneChrome>
  );
};

const AudienceCard = ({
  x,
  y,
  title,
  caption,
  icon,
  delay,
  frame,
}: {
  x: number;
  y: number;
  title: string;
  caption: string;
  icon: string;
  delay: number;
  frame: number;
}) => {
  const p = fade(frame, delay, delay + 45);
  const yOff = interpolate(p, [0, 1], [35, 0]);
  return (
    <div className="audience-card" style={{ left: x, top: y, opacity: p, transform: `translate(-50%, calc(-50% + ${yOff}px))` }}>
      <div className="audience-icon">{icon}</div>
      <div className="audience-title">{title}</div>
      <div className="audience-caption">{caption}</div>
    </div>
  );
};

const AudienceScene = ({ duration }: SceneProps) => {
  const frame = useCurrentFrame();
  return (
    <SceneChrome
      eyebrow="03 / use cases"
      title="Recovery is about people, places, and bad days"
      frame={frame}
      duration={duration}
      beats={[
        { label: "Safeparts is for recovery keys, API tokens, 2FA codes, and break-glass credentials." },
        { label: "Good defaults: 2-of-3 for personal recovery, 3-of-5 for teams." },
        { label: "The plan matters as much as the algorithm." },
      ]}
    >
      <div className="audience-map">
        <svg viewBox="0 0 1920 1080" className="connection-svg">
          <path d="M960 585 C760 430 620 410 450 420" stroke={emerald} opacity=".22" fill="none" />
          <path d="M960 585 C1140 420 1290 405 1485 420" stroke={emerald} opacity=".22" fill="none" />
          <path d="M960 585 C735 610 650 730 460 790" stroke={emerald} opacity=".22" fill="none" />
          <path d="M960 585 C1165 615 1260 730 1480 790" stroke={emerald} opacity=".22" fill="none" />
          <path d="M960 585 C960 490 960 430 960 390" stroke={emerald} opacity=".22" fill="none" />
        </svg>
        <SecretCore x={960} y={585} scale={0.78 + Math.sin(frame / 30) * 0.02} label="one secret" pulse={frame} />
        <AudienceCard x={450} y={420} icon="🔑" title="Password manager" caption="a recovery key split across real fallback paths" delay={50} frame={frame} />
        <AudienceCard x={960} y={390} icon="🛡" title="2FA backup codes" caption="survive a lost phone with separated shares" delay={130} frame={frame} />
        <AudienceCard x={1485} y={420} icon="⚙" title="Team infrastructure" caption="break-glass access with separation of duties" delay={210} frame={frame} />
        <AudienceCard x={460} y={790} icon="👥" title="Family planning" caption="coordinated recovery across trusted people" delay={290} frame={frame} />
        <AudienceCard x={1480} y={790} icon="📦" title="Client handoff" caption="agency, client, and offline fallback shares" delay={370} frame={frame} />
      </div>
    </SceneChrome>
  );
};

const InterfaceWindow = ({ title, code, x, y, delay, frame }: { title: string; code: string[]; x: number; y: number; delay: number; frame: number }) => {
  const p = fade(frame, delay, delay + 50);
  return (
    <div className="interface-window" style={{ left: x, top: y, opacity: p, transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.92, 1])})` }}>
      <div className="window-bar"><span /> <strong>{title}</strong></div>
      <div className="window-code">
        {code.map((line, i) => <div key={line + i}>{line}</div>)}
      </div>
    </div>
  );
};

const InterfacesScene = ({ duration }: SceneProps) => {
  const frame = useCurrentFrame();
  const pulse = 0.75 + Math.sin(frame / 22) * 0.025;
  return (
    <SceneChrome
      eyebrow="04 / product shape"
      title="Different interfaces, one Rust core"
      frame={frame}
      duration={duration}
      beats={[
        { label: "Web UI: local browser workflow through WebAssembly." },
        { label: "CLI: script-friendly split and combine commands." },
        { label: "TUI: offline, keyboard-first terminal recovery." },
      ]}
      tone="blue"
    >
      <div className="interfaces-stage">
        <div className="rust-core" style={{ transform: `translate(-50%, -50%) scale(${pulse})` }}>
          <div className="rust-core-title">safeparts_core</div>
          <div className="rust-core-sub">split · combine · packets · encodings · crypto</div>
        </div>
        <InterfaceWindow title="Web / WASM" x={520} y={330} delay={40} frame={frame} code={["no backend", "browser-local", "split() / combine()"]} />
        <InterfaceWindow title="CLI" x={1340} y={330} delay={120} frame={frame} code={["safeparts split -k 2 -n 3", "safeparts combine", "stdin → stdout"]} />
        <InterfaceWindow title="TUI" x={960} y={770} delay={200} frame={frame} code={["keyboard first", "clipboard / files", "offline workflow"]} />
        <svg className="connection-svg" viewBox="0 0 1920 1080">
          {[[520,330],[1340,330],[960,770]].map(([x,y],i)=>(
            <path key={i} d={`M ${x} ${y} Q 960 520 960 530`} stroke={cyan} strokeWidth="3" opacity={fade(frame, 260+i*20, 360+i*20)*0.4} fill="none" strokeDasharray="14 12" />
          ))}
        </svg>
      </div>
    </SceneChrome>
  );
};

const NotScene = ({ duration }: SceneProps) => {
  const frame = useCurrentFrame();
  const good = fade(frame, 500, 620);
  return (
    <SceneChrome
      eyebrow="05 / threat model"
      title="The storage plan carries the security"
      frame={frame}
      duration={duration}
      beats={[
        { label: "If someone gets k shares, they can recover the secret." },
        { label: "Lose too many shares and the secret is gone." },
        { label: "The security boundary is your distribution plan." },
      ]}
      tone="red"
    >
      <div className="not-stage">
        <div className="bad-vault">
          <div className="bad-title">bad plan</div>
          <div className="folder">shared cloud folder</div>
          <ShareNode x={200} y={295} index={1} scale={1} hue={rose} />
          <ShareNode x={360} y={295} index={2} scale={1} hue={rose} />
          <div className="collapse-ring" style={{ opacity: fade(frame, 160, 260) }} />
          <div className="bad-caption">two shares, one failure zone</div>
        </div>
        <div className="good-plan" style={{ opacity: good }}>
          <div className="good-title">better plan</div>
          <ShareNode x={150} y={160} index={1} />
          <ShareNode x={335} y={165} index={2} />
          <ShareNode x={245} y={305} index={3} />
          <div className="good-caption">independent people, devices, and locations</div>
        </div>
      </div>
    </SceneChrome>
  );
};

const PipelineStage = ({ label, detail, x, active, index }: { label: string; detail: string; x: number; active: number; index: number }) => (
  <div className="pipeline-stage" style={{ left: x, opacity: active, transform: `translate(-50%, -50%) scale(${interpolate(active, [0, 1], [0.88, 1])})` }}>
    <div className="stage-number">{String(index).padStart(2, "0")}</div>
    <div className="stage-label">{label}</div>
    <div className="stage-detail">{detail}</div>
  </div>
);

const SplitScene = ({ duration }: SceneProps) => {
  const frame = useCurrentFrame();
  const stages = [
    ["secret bytes", "text, key, token, or binary data"],
    ["optional encrypt", "Argon2id → ChaCha20-Poly1305"],
    ["integrity tag", "BLAKE3(data) appended"],
    ["Shamir split", "byte-wise over GF(256)"],
    ["SharePacket", "set_id · k · n · x · payload"],
    ["encoding", "base64url · words · bip39"],
  ] as const;
  const tokenX = interpolate(frame, [80, 1550], [230, 1690], { ...clamp, easing: easeInOut });
  const tokenScale = 0.72 + Math.sin(frame / 18) * 0.015;
  return (
    <SceneChrome
      eyebrow="06 / split flow"
      title="The secret becomes self-describing packets"
      frame={frame}
      duration={duration}
      beats={[
        { label: "Safeparts sees arbitrary bytes." },
        { label: "If passphrase protection is enabled, encryption happens before splitting." },
        { label: "A BLAKE3 tag catches bad copy-paste and mixed share sets." },
        { label: "Each share is wrapped into a versioned, self-describing packet." },
      ]}
    >
      <div className="pipeline-line" />
      <SecretCore x={tokenX} y={520} scale={tokenScale} pulse={frame} />
      {stages.map(([label, detail], i) => {
        const start = 90 + i * 230;
        return <PipelineStage key={label} label={label} detail={detail} x={260 + i * 280} active={fade(frame, start, start + 55)} index={i + 1} />;
      })}
      <div className="packet-burst" style={{ opacity: fade(frame, 1320, 1480) }}>
        <ShareNode x={760} y={760} index={1} label="x=1" />
        <ShareNode x={960} y={800} index={2} label="x=2" />
        <ShareNode x={1160} y={760} index={3} label="x=3" />
      </div>
    </SceneChrome>
  );
};

const PolynomialSvg = ({ frame }: { frame: number }) => {
  const lock = fade(frame, 1850, 2050);
  const ambiguity = 1 - lock;
  const points: Point[] = [
    { x: 665, y: 615 },
    { x: 915, y: 410 },
    { x: 1165, y: 570 },
  ];
  return (
    <svg className="math-svg" viewBox="0 0 1920 1080">
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {[
        "M 430 730 C 650 230 1020 920 1450 310",
        "M 430 340 C 720 860 1040 190 1450 710",
        "M 430 560 C 700 350 1040 390 1450 505",
        "M 430 760 C 780 450 1040 705 1450 250",
      ].map((d, i) => (
        <path key={d} d={d} stroke={cyan} strokeWidth="2" opacity={ambiguity * (0.15 + i * 0.05)} fill="none" strokeDasharray="12 16" />
      ))}
      <path d="M 430 790 C 470 760 500 725 520 700 C 570 635 610 615 665 615 C 760 615 805 410 915 410 C 1010 410 1080 570 1165 570 C 1280 570 1390 480 1510 390" stroke={emerald} strokeWidth="5" opacity={0.15 + lock * 0.85} fill="none" filter="url(#glow)" />
      <line x1="420" y1="820" x2="1520" y2="820" stroke="rgba(255,255,255,.12)" />
      <line x1="520" y1="820" x2="520" y2="160" stroke="rgba(255,255,255,.12)" />
      <text x="500" y="855" fill="#8fffe2" fontSize="28">x=0</text>
      <text x="650" y="855" fill="#8fffe2" fontSize="28">1</text>
      <text x="900" y="855" fill="#8fffe2" fontSize="28">2</text>
      <text x="1150" y="855" fill="#8fffe2" fontSize="28">3</text>
      <circle cx="520" cy="700" r={10 + lock * 10} fill={lock > 0.5 ? amber : "transparent"} stroke={amber} strokeWidth="4" opacity={fade(frame, 1940, 2080)} />
      <text x="455" y="675" fill={amber} fontSize="28" opacity={fade(frame, 1940, 2080)}>secret byte</text>
      {points.map((p, i) => (
        <g key={i} opacity={fade(frame, 1120 + i * 170, 1180 + i * 170)}>
          <circle cx={p.x} cy={p.y} r="18" fill="#071211" stroke={emerald} strokeWidth="5" filter="url(#glow)" />
          <text x={p.x - 19} y={p.y - 32} fill="#c7fff1" fontSize="24">share {i + 1}</text>
        </g>
      ))}
    </svg>
  );
};

const ByteGrid = ({ frame }: { frame: number }) => {
  const p = fade(frame, 420, 700) * interpolate(frame, [920, 1100], [1, 0], clamp);
  return (
    <div className="byte-grid" style={{ opacity: p }}>
      {Array.from({ length: 256 }).map((_, i) => {
        const active = (i + Math.floor(frame / 4)) % 37 === 0;
        return <div key={i} className={`byte-cell ${active ? "byte-cell-hot" : ""}`}>{i.toString(16).padStart(2, "0")}</div>;
      })}
      <div className="byte-caption">GF(256): one field element per byte</div>
    </div>
  );
};

const MathScene = ({ duration }: SceneProps) => {
  const frame = useCurrentFrame();
  return (
    <SceneChrome
      eyebrow="07 / underlying maths"
      title="Enough points reveal the curve"
      frame={frame}
      duration={duration}
      beats={[
        { label: "A degree k-1 polynomial is determined by k points." },
        { label: "Safeparts puts each secret byte at x=0, then hides it with random coefficients." },
        { label: "GF(256) keeps the math byte-sized." },
        { label: "Lagrange interpolation reads the hidden value back at x=0." },
      ]}
      tone="blue"
    >
      <ByteGrid frame={frame} />
      <div className="formula-card" style={{ opacity: fade(frame, 760, 920) }}>
        <div className="formula-main">f(x) = byte + a₁x + a₂x²</div>
        <div className="formula-sub">for k=3, random coefficients hide the byte</div>
      </div>
      <PolynomialSvg frame={frame} />
      <div className="math-note" style={{ opacity: fade(frame, 2150, 2350) }}>
        Limit: x=1..255. Safeparts reserves x=0 for reconstruction.
      </div>
    </SceneChrome>
  );
};

const CombineScene = ({ duration }: SceneProps) => {
  const frame = useCurrentFrame();
  const scan = fade(frame, 560, 760);
  const fail = fade(frame, 1220, 1320);
  return (
    <SceneChrome
      eyebrow="08 / combine flow"
      title="Recovery is reconstruction, then verification"
      frame={frame}
      duration={duration}
      beats={[
        { label: "Decode share text back into packets." },
        { label: "Check set_id, k, n, x, payload length, and crypto params." },
        { label: "Interpolate, then verify the BLAKE3 tag." },
        { label: "If encrypted, decrypt only after the share set is consistent." },
      ]}
    >
      <div className="combine-stage">
        <ShareNode x={465} y={360} index={1} label="set A" scale={fade(frame, 80, 140)} />
        <ShareNode x={465} y={535} index={2} label="set A" scale={fade(frame, 160, 220)} />
        <ShareNode x={465} y={710} index={3} label="set A" scale={fade(frame, 240, 300)} />
        <div className="verification-tunnel">
          <div className="tunnel-title">metadata → interpolation → BLAKE3</div>
          <div className="scanner" style={{ transform: `translateX(${interpolate(scan, [0, 1], [-220, 220])}px)`, opacity: scan }} />
        </div>
        <div className="combine-result" style={{ opacity: fade(frame, 760, 940) * interpolate(frame, [1120, 1220], [1, 0], clamp) }}>
          <div className="checkmark">✓</div>
          <div>integrity tag matches</div>
          <div className="result-sub">secret can be released</div>
        </div>
        <div className="bad-share" style={{ opacity: fail }}>
          <ShareNode x={1495} y={470} index={9} label="wrong set" hue={rose} />
          <div className="bad-x">×</div>
          <div className="bad-share-caption">mixed or corrupted shares fail closed</div>
        </div>
      </div>
    </SceneChrome>
  );
};

const EncodingSkin = ({ label, sample, x, y, delay, frame }: { label: string; sample: string; x: number; y: number; delay: number; frame: number }) => {
  const p = fade(frame, delay, delay + 60);
  return (
    <div className="encoding-skin" style={{ left: x, top: y, opacity: p, transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.9, 1])})` }}>
      <div className="encoding-label">{label}</div>
      <div className="encoding-sample">{sample}</div>
    </div>
  );
};

const EncodingsScene = ({ duration }: SceneProps) => {
  const frame = useCurrentFrame();
  return (
    <SceneChrome
      eyebrow="09 / share formats"
      title="Encodings are storage formats"
      frame={frame}
      duration={duration}
      beats={[
        { label: "base64url is compact and machine-friendly." },
        { label: "base58check avoids ambiguous characters and adds a checksum." },
        { label: "mnemo-words is better for paper or metal backups." },
        { label: "BIP-39 phrases carry Safeparts share packets." },
      ]}
    >
      <div className="packet-capsule">
        <div className="capsule-title">SharePacket</div>
        <div className="capsule-row"><span>set_id</span><span>k</span><span>n</span><span>x</span><span>payload</span><span>crypto?</span></div>
      </div>
      <EncodingSkin label="base64url" sample="U01OMQIBAgMBAA..." x={540} y={350} delay={110} frame={frame} />
      <EncodingSkin label="base58check" sample="4fS9rQb2KxW..." x={1380} y={350} delay={260} frame={frame} />
      <EncodingSkin label="mnemo-words" sample="harbor velvet axis ladder ..." x={540} y={735} delay={410} frame={frame} />
      <EncodingSkin label="mnemo-bip39" sample="valid phrase / valid phrase" x={1380} y={735} delay={560} frame={frame} />
    </SceneChrome>
  );
};

const StoryWorld = ({ title, pattern, x, y, delay, frame }: { title: string; pattern: string; x: number; y: number; delay: number; frame: number }) => {
  const p = fade(frame, delay, delay + 55);
  return (
    <div className="story-world" style={{ left: x, top: y, opacity: p, transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.92, 1])})` }}>
      <div className="story-orbit" />
      <div className="story-title">{title}</div>
      <div className="story-pattern">{pattern}</div>
      <ShareNode x={95} y={160} index={1} scale={0.62} />
      <ShareNode x={210} y={115} index={2} scale={0.62} />
      <ShareNode x={270} y={230} index={3} scale={0.62} />
    </div>
  );
};

const StoriesScene = ({ duration }: SceneProps) => {
  const frame = useCurrentFrame();
  return (
    <SceneChrome
      eyebrow="10 / concrete plans"
      title="Choose a plan people can run while stressed"
      frame={frame}
      duration={duration}
      beats={[
        { label: "Personal: two reachable shares plus one off-site fallback." },
        { label: "Team: split by role so no one person can act alone." },
        { label: "Family: controlled recovery shared across trusted holders." },
      ]}
    >
      <StoryWorld title="personal recovery" pattern="2 of 3" x={500} y={550} delay={80} frame={frame} />
      <StoryWorld title="team break-glass" pattern="3 of 5" x={960} y={550} delay={250} frame={frame} />
      <StoryWorld title="family planning" pattern="2 of 4" x={1420} y={550} delay={420} frame={frame} />
      <div className="runbook-strip" style={{ opacity: fade(frame, 900, 1080) }}>
        runbook: holders · locations · contact path · practice drill · rotation after recovery
      </div>
    </SceneChrome>
  );
};

const ClosingScene = ({ duration }: SceneProps) => {
  const frame = useCurrentFrame();
  const constellation = fade(frame, 160, 360);
  return (
    <SceneChrome
      eyebrow="11 / close"
      title="Recover through people, places, and procedure"
      frame={frame}
      duration={duration}
      beats={[
        { label: "Safeparts turns one recovery secret into a distributed recovery plan." },
        { label: "The math supplies the threshold. The humans supply the procedure." },
      ]}
    >
      <div className="closing-stage">
        <Img src={staticFile("logo.svg")} className="closing-logo" style={{ opacity: fade(frame, 40, 140), transform: `translate(-50%, -50%) scale(${0.85 + constellation * 0.12})` }} />
        <svg className="connection-svg" viewBox="0 0 1920 1080" opacity={constellation}>
          {[[520,300],[650,640],[1240,285],[1390,635],[960,230]].map(([x,y],i)=>(
            <g key={i}>
              <path d={`M 960 520 Q ${(960+x)/2} ${(520+y)/2-90} ${x} ${y}`} stroke={emerald} opacity=".35" fill="none" strokeDasharray="12 14" />
              <circle cx={x} cy={y} r="28" fill="#061412" stroke={emerald} strokeWidth="4" />
            </g>
          ))}
        </svg>
        <div className="closing-question" style={{ opacity: fade(frame, 600, 780) }}>
          Who should recover this secret, and under what conditions?
        </div>
      </div>
    </SceneChrome>
  );
};

const sceneComponents: Record<(typeof SCENES)[number]["id"], React.ComponentType<SceneProps>> = {
  intro: IntroScene,
  threshold: ThresholdScene,
  audience: AudienceScene,
  interfaces: InterfacesScene,
  not: NotScene,
  split: SplitScene,
  math: MathScene,
  combine: CombineScene,
  encodings: EncodingsScene,
  stories: StoriesScene,
  closing: ClosingScene,
};

export const SafepartsExplainer = () => {
  let cursor = 0;
  return (
    <AbsoluteFill className="composition-root">
      {SCENES.map((scene) => {
        const Component = sceneComponents[scene.id];
        const from = cursor;
        cursor += scene.duration;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.duration} premountFor={FPS}>
            <Component duration={scene.duration} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const SafepartsPoster = () => (
  <AbsoluteFill className="composition-root">
    <Background />
    <div className="poster-wrap">
      <Img src={staticFile("logo.svg")} className="poster-logo" />
      <div className="poster-kicker">Safeparts Explainer</div>
      <div className="poster-title">Split one secret into a recovery plan</div>
      <div className="poster-subtitle">threshold sharing · GF(256) · BLAKE3 · passphrase protection</div>
    </div>
  </AbsoluteFill>
);
