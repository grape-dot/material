"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Face = {
  index: string;
  title: string;
  body: string;
  bg: string;
  text: string;
  accent: string;
};

// Two faces use the real Airbag Studio copy; the other two extend it in the same voice.
const FACES: Face[] = [
  {
    index: "01",
    title: "We don't worry about change",
    body: "We are the ideal partner for creating unique digital solutions, together.",
    bg: "#b91b4c", // --purple
    text: "#ffffff",
    accent: "#841a3b", // --purple-dark
  },
  {
    index: "02",
    title: "Our route into the future",
    body: "We shape new products by combining design, technology and creativity.",
    bg: "#eeece7", // --grey-beige
    text: "#0c0a0b",
    accent: "#b91b4c",
  },
  {
    index: "03",
    title: "Design meets technology",
    body: "Useful, simple, ergonomic interfaces built around real user needs.",
    bg: "#0c0a0b", // near-black
    text: "#ffffff",
    accent: "#ff6620", // --orange
  },
  {
    index: "04",
    title: "Built to move forward",
    body: "We prototype fast, iterate with data and ship products that scale.",
    bg: "#ff6620", // --orange
    text: "#ffffff",
    accent: "#841a3b",
  },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export default function CuboidCarousel() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const faceRefs = useRef<Array<HTMLDivElement | null>>([]);
  const innerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const dotRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!section || !viewport || !stage) return;

    const faces = faceRefs.current.filter(Boolean) as HTMLDivElement[];
    const inners = innerRefs.current.filter(Boolean) as HTMLDivElement[];
    const dots = dotRefs.current.filter(Boolean) as HTMLSpanElement[];
    const count = FACES.length;
    const SEG = count - 1; // number of transitions
    const FLIP = 90; // degrees each panel turns

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 1024px)",
        isTouch: "(hover: none), (pointer: coarse)",
      },
      (context) => {
        const { isTouch } = context.conditions as { isTouch: boolean };
        // Like the original: the whole 3D sequence is desktop-only.
        if (isTouch) return;

        // --- Page-turn mechanic -------------------------------------------------
        // Each panel fills the stage and rotates in place.
        //   outgoing panel  : hinge at TOP, rotateX 0 -> -FLIP  (lifts away upward)
        //   incoming panel  : hinge at BOTTOM, rotateX +FLIP -> 0 (rises from below)
        // So scrolling down = current page flips up while the next flips in from below.

        // proxy progress: 0 .. SEG (one unit per transition)
        const proxy = { p: 0 };

        const render = (p: number) => {
          const sClamped = Math.min(SEG - 1, Math.max(0, Math.floor(p)));
          const t = p - Math.floor(p); // 0..1 inside the segment

          faces.forEach((face, i) => {
            let rotX: number;
            if (i < sClamped) {
              rotX = -FLIP; // already passed: folded up, hidden
            } else if (i === sClamped) {
              rotX = -FLIP * t; // outgoing: lifting up
            } else if (i === sClamped + 1) {
              rotX = FLIP * (1 - t); // incoming: rising from below
            } else {
              rotX = FLIP; // not yet: waiting below, hidden
            }

            // hinge: panels that are lifting / already lifted hinge at TOP,
            // panels still coming / waiting hinge at BOTTOM.
            face.style.transformOrigin = i <= sClamped ? "50% 0%" : "50% 100%";
            face.style.transform = `rotateX(${rotX.toFixed(3)}deg)`;
            // the incoming panel must sit above the outgoing during the flip
            face.style.zIndex = i === sClamped + 1 ? "3" : i === sClamped ? "2" : "1";

            // content polish: fade/lift based on how front-facing the panel is
            const front = clamp01(1 - Math.abs(rotX) / FLIP);
            const eased = front * front * (3 - 2 * front); // smoothstep
            const inner = inners[i];
            if (inner) {
              inner.style.opacity = (0.1 + 0.9 * eased).toFixed(3);
              inner.style.transform = `translateY(${((1 - eased) * 40).toFixed(
                2
              )}px) scale(${(0.96 + 0.04 * eased).toFixed(3)})`;
            }
          });

          // theme: viewport bg + active dot follow the most front-facing panel
          const active = Math.min(count - 1, Math.round(p));
          const f = FACES[active];
          viewport.style.backgroundColor = f.accent;
          viewport.style.color =
            f.bg === "#eeece7" || f.bg === "#ff6620" ? "#0c0a0b" : "#ffffff";
          dots.forEach((d, i) => d.classList.toggle("is-active", i === active));
        };

        const tween = gsap.to(proxy, {
          p: SEG,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: `+=${SEG * 100}%`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            snap: {
              snapTo: 1 / SEG,
              duration: { min: 0.15, max: 0.4 },
              ease: "power2.inOut",
            },
            invalidateOnRefresh: true,
          },
          onUpdate: () => render(proxy.p),
        });

        const st = tween.scrollTrigger;
        const onResize = () => {
          ScrollTrigger.refresh();
          if (st) render(st.progress * SEG);
        };
        window.addEventListener("resize", onResize);

        render(0);

        return () => {
          window.removeEventListener("resize", onResize);
        };
      }
    );

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="cuboid-section">
      {/* desktop: pinned page-turn stage */}
      <div ref={viewportRef} className="cuboid-viewport">
        <div ref={stageRef} className="cuboid-stage">
          {FACES.map((f, i) => (
            <div
              key={f.index}
              ref={(el) => {
                faceRefs.current[i] = el;
              }}
              className="cuboid-face"
              style={{ backgroundColor: f.bg, color: f.text }}
            >
              <div
                ref={(el) => {
                  innerRefs.current[i] = el;
                }}
                className="cuboid-face__inner"
              >
                <div>
                  <p className="cuboid-face__index">{f.index} — Mission</p>
                  <h2 className="cuboid-face__title" style={{ color: f.accent }}>
                    {f.title}
                  </h2>
                  <p className="cuboid-face__body">{f.body}</p>
                </div>

                <svg
                  className="cuboid-face__mark"
                  viewBox="0 0 321 358"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3.53043 91.658L198.442 3.30924L317.979 267.027L307.921 309.431L122.566 354.269L3.53043 91.658Z"
                    stroke={f.accent}
                    strokeWidth="5"
                  />
                  <path
                    d="M197 3L46 107L1 91.5"
                    stroke={f.accent}
                    strokeWidth="5"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="cuboid-progress" aria-hidden="true">
          {FACES.map((f, i) => (
            <span
              key={f.index}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              className={`cuboid-progress__dot${i === 0 ? " is-active" : ""}`}
            />
          ))}
        </div>
      </div>

      {/* mobile / touch: stacked static cards */}
      <div className="cuboid-stack">
        {FACES.map((f) => (
          <div
            key={f.index}
            className="cuboid-face"
            style={{ backgroundColor: f.bg, color: f.text }}
          >
            <div className="cuboid-face__inner">
              <div>
                <p className="cuboid-face__index">{f.index} — Mission</p>
                <h2 className="cuboid-face__title" style={{ color: f.accent }}>
                  {f.title}
                </h2>
                <p className="cuboid-face__body">{f.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
