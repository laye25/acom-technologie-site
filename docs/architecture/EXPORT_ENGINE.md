# Acom Broderie Export & Machine Profile Engine

This document describes the design of the **Acom Export and Machine Profile Engine** (Acom Export).

The Export Engine converts high-level mathematical toolpaths into low-level binary machine instructions (DST, PES, JEF). It adapts the output to match the hardware characteristics and limitations of different embroidery brands using highly customized **Machine Profiles**.

---

## 1. Embroidery File Format Binary Specifications

Embroidery machines operate on incremental 2D delta coordinate systems $(\Delta x, \Delta y)$ where the coordinate values are usually encoded in tenths of a millimeter ($0.1\text{ mm}$).

### A. Tajima (DST) Specifications
DST is the most common industry standard. It does not store color information, only stitch deltas and commands. It uses a 3-byte coordinate delta compression scheme.

- **Header**: 512-byte ASCII header containing metadata (Stitch Count, Bounds, etc.), padded with spaces.
- **Coordinate System**: Max delta step is $\pm 12.1\text{ mm}$ ($\pm 121$ tenths of a mm) per stitch. If a move is larger, it must be split into multiple **Jump** commands.
- **Bitwise Instruction Format**:
  - Byte 1: Encodes minor step bits and commands.
  - Byte 2: Encodes minor step bits.
  - Byte 3: Encodes large step bits and commands.
- **Commands**:
  - *Normal Stitch*: Standard needle drop.
  - *Jump*: Frame moves without a needle drop.
  - *Color Change (Stop)*: Tells the machine to pause, cut, and change to the next thread needle.

### B. Brother (PES) Specifications
PES is a more modern format used on domestic and semi-industrial Brother machines. It includes:
- **Header**: Contains a signature (`#PES0001` to `#PES0100`), followed by a pointer to the color block palette.
- **Color Palette**: Stores actual thread names and RGB color values.
- **Stitch Block**: Stored as 2-byte coordinate deltas ($\pm 2048$ limit) with embedded command bits.

---

## 2. Machine Profile Engine (Acom Profiles)

The same DST file can broider beautifully on a Tajima but loop thread on a SWF. The **Machine Profile Engine** customizes the stitch generation parameters at compile-time for each targeted brand:

```
                      ┌───────────────────────────┐
                      │    Machine Profile Engine │
                      └─────────────┬─────────────┘
                                    │
         ┌────────────┬─────────────┼────────────┬────────────┐
         ▼            ▼             ▼            ▼            ▼
      Tajima       Brother       Barudan        ZSK         SWF
   (Industrial)  (Domestic)   (Industrial)  (High-Speed) (Flexible)
```

### Machine Specifications Table:

| Machine Brand | Max Stitch Length | Jump Method | Trim Command | Native File | Best Tension Strategy |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Tajima** | $12.1\text{ mm}$ | Triple Jump | `JUMP + STOP` | `.dst` | High Speed Auto-Lock |
| **Brother** | $12.1\text{ mm}$ | Native Jump | `TRIM` block | `.pes` | Standard Dynamic Tension |
| **Barudan** | $12.7\text{ mm}$ | Dual Jump | `BARUDAN_TRIM`| `.dst` / `.u01` | Solenoid Tension Lock |
| **ZSK** | $12.1\text{ mm}$ | Multi Jump | `ZSK_STOP` | `.dst` / `.zsk` | Extreme Speed Damping |
| **SWF** | $12.1\text{ mm}$ | Single Jump | `SWF_TRIM` | `.dst` | Heavy Spring Return |

---

## 3. Serialization and Code Compliance

The `ExportEngine` enforces formatting rules during binary compilation:

1. **Stitch Splitting**: If a satin stitch is longer than the machine's maximum stitch limit (e.g., $12.1\text{ mm}$ for Tajima), the exporter automatically inserts a midpoint needle drop or splits it into multiple stitches to prevent loose loops of thread that can snag and unravel.
2. **Jump Accumulation**: When moving to a distant object, instead of writing one giant jump (which would exceed the byte encoding limits), the exporter automatically splits the distance into an array of smaller relative steps (e.g. splitting a $50\text{ mm}$ jump into five $10\text{ mm}$ jumps).
3. **Automatic Tie-Offs (Lock Stitches)**: Before a thread cut (trim) and after starting a new color, the engine inserts three micro-stitches ($0.6\text{ mm}$) in a tiny triangular or back-and-forth pattern to secure the thread ends, preventing the embroidery from unraveling.
4. **Color Index Mapping**: For formats that support colors (PES, JEF), the engine maps the custom canvas RGB colors to the closest matching standard commercial thread palette (such as Madeira Classic 40, Isacord, or Sulky).
