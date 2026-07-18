# Algorithmic Specification: Adaptive Satin Columns
**Maturité (Règle 52) :** Implemented  

This document specifies the mathematical formulation for the **Adaptive Satin and Column Stitch Engine** inside the Acom Embroidery Engine (AEE).

---

## 1. Problem Definition

Satin stitch is used for narrow columns (widths under $10\text{ mm}$), where the thread weaves directly back and forth between two boundary rails $\mathbf{L}(t)$ and $\mathbf{R}(t)$ without needle drops in the middle. 

The **Adaptive Satin Engine** must solve three problems:
1. Mapping non-uniform sampling steps on highly curved rails.
2. Mitigating density spikes on the inside curve rail (Miter/Corner fans).
3. Automatically converting long stitches ($>12.1\text{ mm}$) to satin-split fills to prevent loose threads.

---

## 2. Parameter Mapping and Point Synthesis

Let the left rail be parameterized by arc-length $s_l \in [0, S_l]$ and the right rail by $s_r \in [0, S_r]$.
The engine samples both curves to produce pairs of boundary points $\mathbf{P}_k^L$ and $\mathbf{P}_k^R$:

$$\mathbf{P}_k^L = \mathbf{L}(s_{l, k}), \quad s_{l, k} = \frac{k}{N} S_l$$

$$\mathbf{P}_k^R = \mathbf{R}(s_{r, k}), \quad s_{r, k} = \frac{k}{N} S_r$$

A satin stitch vector is defined as $\mathbf{S}_k = \mathbf{P}_k^L - \mathbf{P}_k^R$. The width of the column at step $k$ is $w_k = \|\mathbf{S}_k\|$.

---

## 3. Curvature-Based Fan Correction (Short Stitches)

When the ribbon bends sharply, the arc-length ratio between the outer rail and inner rail diverges:

$$\gamma_k = \frac{\Delta s_k^{\text{outer}}}{\Delta s_k^{\text{inner}}} \gg 1.0$$

To maintain a consistent stitch density along the outer edge without bunching stitches on the inside, the engine activates **Adaptive Short Stitches**.

```
                   Left Rail (Outer - sparse drops)
                     L_0      L_1      L_2      L_3      L_4
                      o────────o────────o────────o────────o
                     /        /        /        /        /
                    /        /        /        /        /  Satin Fan
                   /        /        /        /        /
                  o────────o────────o────────o────────o
                 R_0                         R_2
                   Right Rail (Inner - dense drops)
```

### Short Stitch Rule:
At step $k$:
- If the column index $k \equiv 0 \pmod 3$, compile the full stitch: $\mathbf{P}_k^R \to \mathbf{P}_k^L$.
- If $k \equiv 1 \pmod 3$, compile a short stitch extending only to $35\%$ of the column width:
  
$$\mathbf{P}_k^R \to \mathbf{P}_k^R + 0.35 (\mathbf{P}_k^L - \mathbf{P}_k^R)$$

- If $k \equiv 2 \pmod 3$, compile a short stitch extending to $65\%$ of the column width:
  
$$\mathbf{P}_k^R \to \mathbf{P}_k^R + 0.65 (\mathbf{P}_k^L - \mathbf{P}_k^R)$$

This fanning pattern distributes needle drops smoothly across the width of the column, preventing thread accumulation and needle friction on the inside rail.

---

## 4. Satin-Split Transformation

If $w_k > 12.1\text{ mm}$ (or exceeds the maximum limit set by the target machine profile):
- Instead of generating a single satin stitch, the engine splits the stitch into $M$ equal segments:

$$\mathbf{T}_{k, m} = \mathbf{P}_k^R + \frac{m}{M} (\mathbf{P}_k^L - \mathbf{P}_k^R), \quad m \in [0, M]$$

This produces an elegant, structured pattern known as **Split-Satin**, ensuring the embroidery remains tight and snag-resistant.
