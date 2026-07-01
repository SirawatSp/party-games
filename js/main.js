// พฤติกรรมร่วมของทุกหน้า: scroll-reveal animation
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".reveal-up");
  if (!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach((el) => io.observe(el));
});
