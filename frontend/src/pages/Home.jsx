import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, UtensilsCrossed, HandHeart, Trophy, Leaf, Users, Percent, Trash2 } from "lucide-react";
import Reveal from "../components/Reveal";
import "./Home.css";

/** Counts up to `target` the first time the element scrolls into view. */
function AnimatedCounter({ target, suffix = "" }) {
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = Number(target).toLocaleString() + suffix;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const numericTarget = parseInt(target, 10);
          const duration = 2000;
          const step = Math.ceil(numericTarget / (duration / 16));
          let current = 0;
          const timer = setInterval(() => {
            current += step;
            if (current >= numericTarget) {
              current = numericTarget;
              clearInterval(timer);
            }
            el.textContent = current.toLocaleString() + suffix;
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

// Global food-waste figures from the UNEP Food Waste Index Report 2024 and
// the FAO State of Food Security and Nutrition in the World 2023.
const STATS = [
  {
    icon: <Trash2 />,
    target: "1050000000",
    suffix: "+",
    label: "Tonnes Wasted Yearly",
    desc: "Food thrown away globally every year — roughly a fifth of all food available to consumers.",
  },
  {
    icon: <Percent />,
    target: "33",
    suffix: "%",
    label: "Of Food Never Eaten",
    desc: "About a third of all food produced for human consumption is lost or wasted along the way.",
  },
  {
    icon: <Users />,
    target: "735000000",
    suffix: "+",
    label: "People Facing Hunger",
    desc: "While food is discarded at scale, hundreds of millions go to bed hungry every night.",
  },
  {
    icon: <Leaf />,
    target: "8",
    suffix: "%",
    label: "Of Global Emissions",
    desc: "Food loss and waste generate up to a tenth of the world's greenhouse-gas emissions.",
  },
];

export default function Home() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <Leaf size={16} />
            <span>Fighting Food Waste, Together</span>
          </div>
          <h1 className="hero-heading">
            Every plate saved<br />
            <em>feeds a life.</em>
          </h1>
          <p className="hero-sub">
            Khaana Bachaao connects surplus food from donors directly to NGOs, shelters and
            individuals in need — in real time, with nothing lost in between.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn-hero-primary">
              Donate Food <ArrowRight size={20} />
            </Link>
            <Link to="/register" className="btn-hero-secondary">
              Request Assistance
            </Link>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <span>Scroll to explore</span>
          <div className="scroll-dot" />
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-wrapper">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 90}>
              <div className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </div>
                <div className="stat-label">{stat.label}</div>
                <p className="stat-desc">{stat.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mission-section">
        <Reveal className="mission-inner">
          <div className="mission-tag">Why This Exists</div>
          <h2 className="mission-heading">
            Access to nutritious food is the{" "}
            <span className="mission-highlight">highest form of preventive medicine.</span>
          </h2>
          <p className="mission-body">
            The gap between food surplus and food insecurity is a logistics problem, not a
            scarcity problem. This platform gives restaurants, event organisers and households
            a direct channel to list surplus food — and gives NGOs, shelters and families a
            direct channel to claim it, while it is still good to eat.
          </p>
        </Reveal>
      </section>

      <section className="ops-section">
        <div className="ops-inner">
          <Reveal>
            <h2 className="section-title">How the Platform Helps</h2>
            <p className="section-sub">Two sides of the same mission — moving food to where it's needed</p>
          </Reveal>

          <div className="ops-grid">
            <Reveal delay={100}>
              <div className="op-card">
                <div className="op-image-wrap">
                  <img src="/kitchen_ops.png" alt="Community kitchens receiving donated food" className="op-img" />
                  <div className="op-image-overlay" />
                </div>
                <div className="op-body">
                  <div className="op-icon-wrap">
                    <UtensilsCrossed size={24} />
                  </div>
                  <h3>Donation Board</h3>
                  <p>
                    Donors post what they have — cooked meals, raw produce or packaged goods —
                    with quantity and freshness window. Listings stay visible until they are
                    claimed or expire.
                  </p>
                  <Link to="/register" className="op-cta">
                    Join as a Donor <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="op-card">
                <div className="op-image-wrap">
                  <img src="/delivery_ops.png" alt="Volunteers delivering grocery kits" className="op-img" />
                  <div className="op-image-overlay" />
                </div>
                <div className="op-body">
                  <div className="op-icon-wrap">
                    <HandHeart size={24} />
                  </div>
                  <h3>Assistance Requests</h3>
                  <p>
                    Receivers browse what is available nearby, request what they need and add a
                    note for the donor. Approved requests are tracked end to end, so nothing
                    goes to waste silently.
                  </p>
                  <Link to="/register" className="op-cta">
                    Request Assistance <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="how-inner">
          <Reveal>
            <h2 className="section-title">Simple. Fast. Transparent.</h2>
            <p className="section-sub">Three steps to make a difference</p>
          </Reveal>
          <div className="steps-grid">
            <Reveal delay={80}>
              <div className="step-card">
                <div className="step-number">01</div>
                <h3>Register</h3>
                <p>Create an account as a donor or a receiver in under a minute.</p>
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div className="step-card">
                <div className="step-number">02</div>
                <h3>List or Request</h3>
                <p>Donors list surplus food; receivers browse and request what they need — in real time.</p>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <div className="step-card">
                <div className="step-number">03</div>
                <h3>Deliver Impact</h3>
                <p>Donors approve requests, food finds its people, and every meal saved is tracked.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <Reveal className="cta-inner">
          <Trophy size={40} color="var(--color-primary)" />
          <h2>Ready to make a difference?</h2>
          <p>Join the donors and volunteers already fighting hunger in your city.</p>
          <div className="cta-btns">
            <Link to="/register" className="btn-hero-primary">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-hero-outline">
              Login to Dashboard
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <UtensilsCrossed size={24} color="var(--color-primary)" />
            <span>Khaana Bachaao</span>
          </div>
          <p className="footer-tagline">Fighting food waste. Feeding hope.</p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} Khaana Bachaao. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
