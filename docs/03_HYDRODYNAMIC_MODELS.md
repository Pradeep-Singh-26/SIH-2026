# 🌊 Hydrodynamic Models & Mathematical Formulations
### Technical Reference: Dam Break Hydraulics, Delft3D-FM, and DualSPHysics

---

## 🔬 1. Introduction

Accurate simulation of a catastrophic dam break demands mathematical models operating across two distinct regimes:
1. **The Breach Zone**: Rapid geotechnical erosion and transient outflow hydrograph formation at the dam crest.
2. **The Far-Field Inundation Zone**: 2D free-surface shallow water wave propagation down river valleys and floodplains.
3. **The Near-Field Shock Zone**: Highly turbulent, non-hydrostatic 3D fluid-structure impact against immediate downstream structures.

This document details the governing equations, numerical schemes, and scientific assumptions implemented in the platform.

---

## 💥 2. Breach Geotechnical Formulations (Froehlich 2008)

Breach formation at earthen or composite dams is governed by hydrodynamic shear stresses eroding the embankment core. To determine the peak outflow discharge and breach geometry without requiring complex soil mechanics finite element models during emergency planning, the platform implements **Dr. David C. Froehlich’s (2008)** empirical formulations:

### Average Breach Width ($\bar{B}$)
$$\bar{B} = 0.27 \cdot k_0 \cdot V_w^{0.32} \cdot h_b^{0.04}$$

- $\bar{B}$: Average breach width ($\text{m}$)
- $k_0$: Failure mode coefficient:
  - $k_0 = 1.30$ for **Overtopping** failures (water spilling over the crest)
  - $k_0 = 1.00$ for **Piping / Internal Seepage** failures
- $V_w$: Reservoir volume at failure time ($\text{m}^3$)
- $h_b$: Height of the breach cavity ($\text{m}$)

### Breach Formation Time ($t_f$)
$$t_f = 63.2 \cdot \sqrt{\frac{V_w}{g \cdot h_b^2}}$$

- $t_f$: Formation time in seconds ($s$)
- $g$: Acceleration due to gravity ($9.81\text{ m/s}^2$)

### Peak Outflow Discharge ($Q_p$)
$$Q_p = 0.607 \cdot V_w^{0.295} \cdot h_w^{1.24}$$

- $Q_p$: Maximum discharge at breach apex ($\text{m}^3/\text{s}$)
- $h_w$: Depth of water above the breach invert ($\text{m}$)

### Hydrograph Time Discretization
The temporal discharge curve $Q(t)$ feeding into the hydrodynamic downstream boundary is modeled using a skewed parabolic hydrograph:

$$Q(t) = \begin{cases} 
Q_0 + (Q_p - Q_0) \cdot \left(\frac{t}{t_r}\right)^2 & \text{for } 0 \le t \le t_r \\
Q_p \cdot \exp\left(-\frac{t - t_r}{k_d}\right) & \text{for } t > t_r 
\end{cases}$$

Where $t_r$ is the time-to-peak (typically $0.33 \cdot t_f$), and $k_d$ is the recession constant calibrated to match the total reservoir evacuation volume $\int_0^\infty Q(t) dt = V_w$.

---

## 🌊 3. Delft3D Flexible Mesh (2D Shallow Water Equations)

For downstream flood propagation across the Ghataprabha River basin, the platform employs the **2D Depth-Averaged Shallow Water Equations (St. Venant Equations)** solved by **Delft3D Flexible Mesh (D-Flow FM)**.

### Governing Differential Equations

#### 1. Conservation of Mass (Continuity)
$$\frac{\partial h}{\partial t} + \frac{\partial (hu)}{\partial x} + \frac{\partial (hv)}{\partial y} = q_{\text{in}}$$

Where:
- $h$: Total water depth ($\text{m}$)
- $\zeta$: Free surface water elevation above datum ($\text{m}$)
- $u, v$: Depth-averaged velocity components in the $x$ and $y$ Cartesian directions ($\text{m/s}$)
- $q_{\text{in}}$: Inflow source term (e.g., dam breach discharge per unit area)

#### 2. Conservation of Momentum ($x$-direction)
$$\frac{\partial (hu)}{\partial t} + \frac{\partial (hu^2)}{\partial x} + \frac{\partial (huv)}{\partial y} = -gh \frac{\partial \zeta}{\partial x} - \frac{\tau_{bx}}{\rho} + \nu_t \left(\frac{\partial^2 (hu)}{\partial x^2} + \frac{\partial^2 (hu)}{\partial y^2}\right) + f_{\text{cor}} hv$$

#### 3. Conservation of Momentum ($y$-direction)
$$\frac{\partial (hv)}{\partial t} + \frac{\partial (huv)}{\partial x} + \frac{\partial (hv^2)}{\partial y} = -gh \frac{\partial \zeta}{\partial y} - \frac{\tau_{by}}{\rho} + \nu_t \left(\frac{\partial^2 (hv)}{\partial x^2} + \frac{\partial^2 (hv)}{\partial y^2}\right) - f_{\text{cor}} hu$$

Where:
- $g$: Gravitational acceleration ($9.81\text{ m/s}^2$)
- $\rho$: Density of water ($1000\text{ kg/m}^3$)
- $\nu_t$: Horizontal eddy viscosity ($\text{m}^2/\text{s}$)
- $f_{\text{cor}}$: Coriolis parameter ($2\Omega \sin \phi$)

### Bed Shear Stress & Manning's Formulation
Bed friction $\tau_{bx}, \tau_{by}$ is parameterized using the Manning roughness coefficient $n$:

$$\frac{\tau_{bx}}{\rho} = \frac{g n^2 u \sqrt{u^2 + v^2}}{h^{1/3}}, \quad \frac{\tau_{by}}{\rho} = \frac{g n^2 v \sqrt{u^2 + v^2}}{h^{1/3}}$$

In the Ghataprabha basin model:
- Main river channel: $n = 0.032\text{ s/m}^{1/3}$
- Overbank floodplain & agriculture: $n = 0.045\text{ s/m}^{1/3}$
- Urban settlements (Gokak): $n = 0.080\text{ s/m}^{1/3}$

### Numerical Stability & Courant Condition (CFL)
To ensure convergence of the explicit-implicit finite volume scheme, time-stepping $\Delta t$ satisfies the Courant-Friedrichs-Lewy condition:

$$C = \frac{(|u| + \sqrt{gh})\Delta t}{\Delta x} \le 0.7$$

---

## ⚡ 4. DualSPHysics (Smoothed Particle Hydrodynamics)

For near-field hydrodynamic wave shock—such as the collapse of the water column against the powerhouse or canyon walls—traditional grid-based SWE assumptions break down because the vertical acceleration $\partial w / \partial t$ is non-zero and pressures are non-hydrostatic.

Here, the system utilizes **Smoothed Particle Hydrodynamics (SPH)** via **DualSPHysics**.

### Mathematical Formulation
SPH is a meshfree Lagrangian particle method where fluid properties at position $\mathbf{r}_a$ are calculated by summing contributions from neighboring particles $b$ weighted by a smoothing kernel $W(\mathbf{r}_a - \mathbf{r}_b, h_s)$:

$$\langle f(\mathbf{r}_a) \rangle = \sum_b \frac{m_b}{\rho_b} f(\mathbf{r}_b) W_{ab}$$

### Continuity Equation
$$\frac{d\rho_a}{dt} = \sum_b m_b \mathbf{v}_{ab} \cdot \nabla_a W_{ab}$$

### Momentum Equation (Navier-Stokes)
$$\frac{d\mathbf{v}_a}{dt} = -\sum_b m_b \left(\frac{P_a}{\rho_a^2} + \frac{P_b}{\rho_b^2} + \Pi_{ab}\right) \nabla_a W_{ab} + \mathbf{g}$$

Where:
- $\mathbf{v}_{ab} = \mathbf{v}_a - \mathbf{v}_b$
- $P_a, P_b$: Pressures of particles $a$ and $b$
- $\Pi_{ab}$: Artificial viscosity term preventing unphysical particle interpenetration:

$$\Pi_{ab} = \begin{cases} 
\frac{-\alpha \bar{c}_{ab} \mu_{ab} + \beta \mu_{ab}^2}{\bar{\rho}_{ab}} & \text{if } \mathbf{v}_{ab} \cdot \mathbf{r}_{ab} < 0 \\
0 & \text{otherwise}
\end{cases}$$

$$\mu_{ab} = \frac{h_s (\mathbf{v}_{ab} \cdot \mathbf{r}_{ab})}{|\mathbf{r}_{ab}|^2 + 0.01 h_s^2}$$

### Equation of State (Tait Equation)
DualSPHysics models water as a weakly compressible fluid (WCSPH), relating pressure $P$ to density $\rho$:

$$P = B \left[ \left(\frac{\rho}{\rho_0}\right)^\gamma - 1 \right]$$

Where $\gamma = 7$, and $B = \frac{c_0^2 \rho_0}{\gamma}$, with artificial speed of sound $c_0 \ge 10 \cdot v_{\max}$ to maintain density variations below $1\%$.

### Kernel Function
The platform standardizes on the **Wendland Quintic Kernel** ($C^2$), which eliminates particle pairing instability and delivers accurate velocity gradients.

---

## 📊 5. Model Comparison: Delft3D-FM vs DualSPHysics

| Characteristic | Delft3D Flexible Mesh | DualSPHysics (SPH) |
| :--- | :--- | :--- |
| **Domain Scope** | Macro-catchment ($10\text{ km} - 100\text{ km}$) | Micro-domain ($10\text{ m} - 1\text{ km}$) |
| **Grid Type** | Unstructured 2D Mesh | Meshfree Lagrangian Particles |
| **Vertical Dimension** | Depth-Averaged (2D) | Fully 3D Resolved |
| **Hydrostatic Assumption**| Yes ($P = \rho g h$) | No (Full Dynamic Pressure Tensor) |
| **Shock Capturing** | Approximate Riemann Solvers | Natural Particle Impact Splashing |
| **Compute Demand** | CPU-efficient (Minutes) | GPU-intensive (CUDA Kernels) |
| **Primary Output** | Inundation extent, depth raster, arrival isochrones | Peak impact pressure on piers, wave splash |
