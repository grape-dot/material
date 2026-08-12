import CuboidCarousel from "@/components/CuboidCarousel";

export default function Home() {
  return (
    <main className="page">
      <section className="spacer">
        <p className="spacer__hint">
          Scroll down — each page flips up while the next turns in from below.
        </p>
      </section>

      <CuboidCarousel />

      <section className="spacer">
        <p className="spacer__hint">End of the sequence. Scroll back up to replay.</p>
      </section>
    </main>
  );
}
