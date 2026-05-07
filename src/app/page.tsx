import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import styles from "./page.module.css";

function BookmeMark({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="BookMe AI mark"
    >
      <defs>
        <linearGradient id="bmMarkBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2672CB" />
          <stop offset="100%" stopColor="#1A58AE" />
        </linearGradient>
        <radialGradient id="bmOrbGrad" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0%" stopColor="#EAF2FF" />
          <stop offset="60%" stopColor="#8BB9F9" />
          <stop offset="100%" stopColor="#2672CB" />
        </radialGradient>
      </defs>
      <rect x="10" y="10" width="200" height="200" rx="46" fill="url(#bmMarkBg)" />
      <rect x="62" y="2" width="14" height="34" rx="4" fill="#0A3A72" />
      <rect x="144" y="2" width="14" height="34" rx="4" fill="#0A3A72" />
      <rect x="10" y="36" width="200" height="34" fill="#0A3A72" />
      <circle cx="110" cy="138" r="58" fill="#8BB9F9" opacity="0.18" />
      <circle cx="110" cy="138" r="44" fill="url(#bmOrbGrad)" />
      <ellipse cx="96" cy="122" rx="14" ry="9" fill="#FFFFFF" opacity="0.55" />
    </svg>
  );
}

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function LandingPage() {
  return (
    <div className={styles.bm}>
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand} aria-label="BookMe AI home">
            <BookmeMark size={36} />
            <span className={styles.brandText}>
              <span className={styles.brandWord}>BookMe</span>
              <span className={styles.brandTag}>A&middot;I</span>
            </span>
          </Link>
          <div className={styles.navLinks}>
            <Link href="/pricing" className={`${styles.btn} ${styles.btnGhost}`}>
              Pricing
            </Link>
            <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowLine} />
                BookMe AI &middot; WhatsApp-native scheduling
              </div>
              <h1 className={styles.heroH1}>
                Your AI receptionist <em>that never sleeps.</em>
              </h1>
              <p className={styles.lede}>
                Connect WhatsApp Business and Google Calendar. The assistant reads
                requests, checks availability, and confirms bookings &mdash; quietly,
                around the clock.
              </p>
              <div className={styles.heroCtaRow}>
                <Link
                  href="/login"
                  className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
                >
                  Get started free
                  <ArrowRight />
                </Link>
                <Link
                  href="/pricing"
                  className={`${styles.btn} ${styles.btnGhostInverse} ${styles.btnLg}`}
                >
                  See pricing
                </Link>
              </div>
              <div className={styles.heroPills}>
                <span className={styles.pill}>
                  <span className={styles.pillDot} />
                  WhatsApp Business
                </span>
                <span className={styles.pill}>
                  <span className={styles.pillDot} />
                  Google Calendar
                </span>
                <span className={styles.pill}>
                  <span className={styles.pillDot} />
                  Replies in seconds
                </span>
              </div>
            </div>
            <div className={styles.heroMark}>
              <BookmeMark size={280} />
            </div>
          </div>
        </section>

        {/* PREVIEW · WhatsApp + Calendar */}
        <section className={styles.preview}>
          <div className={styles.previewInner}>
            <div className={styles.previewHead}>
              <span className={styles.sectionTag}>What customers see</span>
              <h2 className={styles.h2}>
                The assistant takes the message, then books the slot.
              </h2>
              <p className={styles.bodyMuted}>
                Native WhatsApp on their side. Marked, transparent, and on the
                calendar on yours.
              </p>
            </div>
            <div className={styles.previewGrid}>
              <div className={styles.waPanel}>
                <div className={styles.waHeader}>
                  <div className={styles.waAvatar}>S</div>
                  <div>
                    <div className={styles.waName}>Sara Mendes</div>
                    <div className={styles.waMeta}>online</div>
                  </div>
                </div>
                <div className={styles.waBody}>
                  <div className={styles.waBubbleIn}>
                    Hi &mdash; can I get a cleaning appointment Thursday afternoon?
                  </div>
                  <div className={styles.waBubbleOut}>
                    <span className={styles.aiTag}>
                      <span className={styles.aiDot} />
                      AI Reply
                    </span>
                    <p>
                      Thursday 2:30 PM works. I&rsquo;ll book it under Sara
                      Mendes &mdash; confirm?
                    </p>
                  </div>
                  <div className={styles.waBubbleIn}>Yes please.</div>
                  <div className={styles.waBubbleOut}>
                    <span className={styles.aiTag}>
                      <span className={styles.aiDot} />
                      AI Reply
                    </span>
                    <p>Booked. Thursday at 2:30 PM. Calendar updated.</p>
                  </div>
                </div>
              </div>

              <div className={styles.calPanel}>
                <div className={styles.calHeader}>
                  <span className={styles.mono}>
                    Google Calendar &middot; Thursday
                  </span>
                  <span className={styles.statusBadge}>
                    <span className={styles.statusDot} />
                    Confirmed
                  </span>
                </div>
                <div className={styles.calRow}>
                  <span className={styles.calTime}>13:00</span>
                  <div className={styles.calSlot} />
                </div>
                <div className={styles.calRow}>
                  <span className={styles.calTime}>14:00</span>
                  <div className={styles.calSlot} />
                </div>
                <div className={styles.calRow}>
                  <span className={styles.calTime}>14:30</span>
                  <div className={`${styles.calSlot} ${styles.calEvent}`}>
                    <div className={styles.calEventTitle}>
                      Cleaning &middot; Sara Mendes
                    </div>
                    <div className={styles.calEventMeta}>
                      Booked by AI &middot; 30 min
                    </div>
                  </div>
                </div>
                <div className={styles.calRow}>
                  <span className={styles.calTime}>15:30</span>
                  <div className={styles.calSlot} />
                </div>
                <div className={styles.calRow}>
                  <span className={styles.calTime}>16:30</span>
                  <div className={styles.calSlot} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PILLARS */}
        <section className={styles.pillars}>
          <div className={styles.pillarsInner}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTag}>Built around four ideas</span>
              <h2 className={styles.h2}>A calm assistant, not a noisy bot.</h2>
            </div>
            <div className={styles.pillarGrid}>
              <article className={styles.pillarCard}>
                <div className={styles.pillarGlyph}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9 8.5 8.5 0 018.5 8.5z" />
                  </svg>
                </div>
                <h3>WhatsApp native</h3>
                <p>
                  Customers chat where they already are. We don&rsquo;t reskin the
                  experience &mdash; we just answer.
                </p>
              </article>
              <article className={styles.pillarCard}>
                <div className={styles.pillarGlyph}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M8 3v4M16 3v4M3 9h18" />
                  </svg>
                </div>
                <h3>Calendar-aware</h3>
                <p>
                  Every reply checks Google Calendar in real time, so the AI never
                  offers a slot you don&rsquo;t have.
                </p>
              </article>
              <article className={styles.pillarCard}>
                <div className={styles.pillarGlyph}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </div>
                <h3>Always marked</h3>
                <p>
                  Every AI message and every AI-booked appointment carries an
                  &ldquo;AI&rdquo; tag. You always know who said what.
                </p>
              </article>
              <article className={styles.pillarCard}>
                <div className={styles.pillarGlyph}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>
                <h3>Replies in seconds</h3>
                <p>
                  Snappy by design. Answer the booking before they message the
                  next place on the list.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className={styles.how}>
          <div className={styles.howInner}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTag}>Setup &middot; four steps</span>
              <h2 className={styles.h2}>Live in an afternoon.</h2>
            </div>
            <ol className={styles.steps}>
              <li>
                <span className={styles.stepNum}>01</span>
                <h3>Sign in with Google</h3>
                <p>
                  One click grants calendar access. Tokens are long-lived and
                  encrypted at rest.
                </p>
              </li>
              <li>
                <span className={styles.stepNum}>02</span>
                <h3>Set up your services</h3>
                <p>
                  Pre-loaded defaults for your profession. Edit durations, prices,
                  and intake notes from one screen.
                </p>
              </li>
              <li>
                <span className={styles.stepNum}>03</span>
                <h3>Connect WhatsApp</h3>
                <p>
                  Link your WhatsApp Business number through Meta. We handle the
                  verification handshake.
                </p>
              </li>
              <li>
                <span className={styles.stepNum}>04</span>
                <h3>The AI takes over</h3>
                <p>
                  From the next message onward, customers book themselves. You
                  just see the appointments appear.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* BUILT FOR */}
        <section className={styles.builtFor}>
          <div className={styles.builtForInner}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTag}>Built for</span>
              <h2 className={styles.h2}>
                Service businesses with full books and tired front desks.
              </h2>
            </div>
            <div className={styles.professionGrid}>
              <article className={styles.professionCard}>
                <div className={styles.professionEyebrow}>Dental</div>
                <h3>Cleanings, exams, fillings.</h3>
                <p>
                  A pre-configured catalogue covering hygiene visits, restorative
                  work, and emergency slots &mdash; all editable.
                </p>
              </article>
              <article className={styles.professionCard}>
                <div className={styles.professionEyebrow}>Auto</div>
                <h3>Oil, brakes, diagnostics.</h3>
                <p>
                  The standard mechanic menu out of the box, with realistic
                  durations so the AI doesn&rsquo;t double-book the bay.
                </p>
              </article>
            </div>
            <p className={styles.builtForFooter}>More professions coming soon.</p>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaInner}>
            <BookmeMark size={88} />
            <h2 className={styles.ctaH2}>Stop missing bookings at 11&thinsp;PM.</h2>
            <p>
              Connect once. The assistant answers the next message &mdash; and
              every one after.
            </p>
            <Link
              href="/login"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
            >
              Get started free
              <ArrowRight />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter className={styles.footer} />
    </div>
  );
}
