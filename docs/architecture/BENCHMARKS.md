# Acom Broderie Benchmarking Framework (Acom Bench)

This document establishes the **Benchmarking Framework** for comparing the Acom CAD/CAM Core Engine against world-leading proprietary embroidery software (Wilcom, Tajima DG by Pulse, Ink/Stitch).

Having a measurable framework ensures that every algorithmic optimization (e.g., changes to the Tatami fill angle or Satin fan mitering) can be validated using hard data.

---

## 1. Key Performance Indicators (KPIs)

The quality and efficiency of an embroidery file are evaluated on seven standardized metrics:

| Metric | Definition | Optimal Target | Why It Matters |
| :--- | :--- | :--- | :--- |
| **Stitch Count Ratio** | Total compiled stitches vs the theoretical minimum. | Less than $1.05 \times$ industry best. | Reduces wear on machinery and thread usage. |
| **Travel Efficiency** | Total length of non-stitching movements (jumps). | $< 5\%$ of total thread length. | Saves production time; reduces loose thread tails. |
| **Cut Count** | Number of automatic thread trims triggered. | Cleanest possible (1 per color change + absolute minimum jumps). | Trims add up to 5-10 seconds per cut in industrial runtimes. |
| **Density Index** | Percentage of $1\text{ mm} \times 1\text{ mm}$ zones exceeding safety thresholds. | $0.0\%$ | Prevents needle breaks and thread shredding. |
| **Color Changes** | Number of color change sequences. | Exactly equal to unique color block count. | Avoids redundant color swaps caused by bad pathing. |
| **Fidelity Score** | Hausdorff distance between compiled stitch outline and original vector geometry. | $< 0.2\text{ mm}$ deviation. | Guarantees physical embroidery matches digital design. |
| **Total Cycle Time** | Total estimated time for machine execution. | Lowest possible at $800\text{ rpm}$ base speed. | Direct impact on industrial tailor workshop profitability. |

---

## 2. Test Vectors & Benchmarks Suite

To conduct benchmarks, the core runs a suite of **Standardized Test Shapes**:

1. **Test Vector A (The 5cm Satin Monogram)**:
   - *Shape*: A stylized letter "B" with serifs and curves.
   - *Challenges*: Joint overlap, inner curve fanning, centerline underlay integrity.
2. **Test Vector B (The 15cm Tatami Circle)**:
   - *Shape*: A perfect circular fill.
   - *Challenges*: Lengthwise shrinkage pre-compensation, row offsets, stitch count density check.
3. **Test Vector C (The Organic Rose - Floral Detail)**:
   - *Shape*: A combination of running stitch stems, satin petals, and leaf groups.
   - *Challenges*: Path-finding (TSP solver) to minimize cuts, under-leaf path hiding.

---

## 3. Reference Scorecard (Acom vs Competitors)

Below is the comparative score tracker maintained by the QA team:

| Metric | Acom (V1 Monolith) | Acom (V2 Hexagonal) | Wilcom ES | Tajima DG | Ink/Stitch |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Vector A Cuts** | 12 | **2** | 2 | 2 | 5 |
| **Vector B Fidelity** | $0.8\text{ mm}$ | **$0.15\text{ mm}$** | $0.12\text{ mm}$ | $0.15\text{ mm}$ | $0.4\text{ mm}$ |
| **Vector C Cycle Time**| $14\text{ min}$ | **$8.5\text{ min}$** | $8.1\text{ min}$ | $8.4\text{ min}$ | $11.2\text{ min}$ |
| **Density Spikes** | 8.5% | **0.0%** | 0.0% | 0.0% | 4.2% |

By transitioning to the hexagonal CAD/CAM architecture, the new **Acom V2 Core Engine** approaches professional Wilcom performance while remaining fully open-source and natively integrated into our SaaS platform.
