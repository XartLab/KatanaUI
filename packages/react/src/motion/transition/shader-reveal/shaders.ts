// SPDX-License-Identifier: MIT
// 改自 SmoothUI 的 shader-reveal-transition、sdf-blob-transition、aperture-blur-transition、chroma-blur-transition 的片元着色器
// （https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。相对原件：写死的粉、青、金、薄荷色改成 uC0 到 uC3 四个颜色 uniform，
// 由调用方传 token（--accent、--signal-*），颜色不写进着色器；几何、噪声、时序一字未动。
// uC0 主色、uC1 冷色、uC2 暖色、uC3 第四色（默认顺序见 ./engine.ts 的 DEFAULT_COLORS）。

export const SHADER_REVEAL_FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uProgress;
uniform float uAlpha;
uniform float uVariant;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
#define PI 3.14159265359

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float parabola(float x, float k){ return pow(4.0 * x * (1.0 - x), k); }
mat2 rot(float a){ float s = sin(a); float c = cos(a); return mat2(c, -s, s, c); }

vec4 paint(vec2 uv, float mask, vec3 color, float glow){
  float exitFade = smoothstep(1.0, 0.76, uProgress);
  float entryFade = smoothstep(0.0, 0.10, uProgress);
  float alpha = clamp((mask * 0.76 + glow * 0.24) * entryFade * exitFade * uAlpha, 0.0, 0.92);
  return vec4(color * alpha + vec3(1.0) * glow * 0.16 * uAlpha, alpha);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (uv - 0.5) * aspect;
  float progress = smoothstep(0.0, 1.0, uProgress);
  vec3 pink = uC0;
  vec3 cyan = uC1;
  vec3 gold = uC2;
  vec3 mint = uC3;

  float mask = 0.0;
  float glow = 0.0;
  vec3 color = mix(pink, cyan, uv.x);

  if (uVariant < 0.5) {
    // Demo 1 — turbulent noise threshold. Chunky, organic gate.
    float n1 = noise(uv * vec2(18.0, 12.0) + uTime * 0.42);
    float n2 = noise(uv * vec2(52.0, 44.0) - uTime * 0.18);
    float threshold = progress * 1.35 - 0.18;
    float gate = smoothstep(threshold - 0.18, threshold + 0.18, uv.x * 0.62 + uv.y * 0.28 + n1 * 0.34 + n2 * 0.08);
    mask = pow(gate * (1.0 - gate) * 4.0, 0.74) + step(0.74, n2) * gate * 0.22;
    glow = exp(-pow(uv.x + n1 * 0.26 - progress, 2.0) * 26.0);
    color = mix(pink, mint, n1);
  } else if (uVariant < 1.5) {
    // Demo 2 — zoom mix. Large central lens, not a sweep.
    float yGate = smoothstep(0.0, 1.0, progress * 2.15 + uv.y - 1.08);
    vec2 z = (uv - 0.5) * mix(1.75, 0.35, yGate) + 0.5;
    float lens = 1.0 - smoothstep(0.12, 0.78, length((z - 0.5) * aspect));
    float seam = exp(-pow(yGate - 0.5, 2.0) * 20.0);
    mask = (lens * 0.72 + seam * 0.42) * parabola(progress, 0.42);
    glow = seam * 0.9 + lens * 0.25;
    color = mix(gold, cyan, yGate);
  } else if (uVariant < 2.5) {
    // Demo 3 — noisy circular reveal.
    float n = noise(uv * 9.0 + uTime * 0.25);
    float radius = progress * 1.08 + n * 0.045;
    float d = length(p) - radius * 0.72;
    mask = exp(-d * d * 42.0) + smoothstep(0.08, -0.12, d) * 0.18;
    glow = exp(-d * d * 140.0);
    color = mix(pink, gold, atan(p.y, p.x) / PI * 0.5 + 0.5);
  } else if (uVariant < 3.5) {
    // Demo 4 — displacement wipe. Narrow noisy blade.
    float n = noise(uv * vec2(12.0, 26.0) + vec2(uTime * 0.26, -uTime * 0.12));
    float blade = progress * 1.32 - 0.16 + n * 0.11;
    float edge = blade - uv.x;
    float front = exp(-edge * edge * 120.0);
    float fillSide = smoothstep(-0.03, 0.16, edge) * 0.18;
    mask = front * 0.92 + fillSide;
    glow = front;
    color = mix(cyan, vec3(1.0), front * 0.38);
  } else if (uVariant < 4.5) {
    // Demo 5 — luminance displacement. Horizontal ribbons pulled vertically.
    float lum = noise(uv * 5.0 + vec2(0.0, uTime * 0.22));
    float displacedY = uv.y + progress * (lum - 0.5) * 0.55;
    float ribbons = sin(displacedY * 58.0 + uTime * 1.25) * 0.5 + 0.5;
    float fine = sin(displacedY * 132.0 - uTime * 1.8) * 0.5 + 0.5;
    float window = smoothstep(0.03, 0.5, progress) * smoothstep(1.0, 0.72, progress);
    mask = (smoothstep(0.58, 0.92, ribbons) * 0.74 + smoothstep(0.76, 0.98, fine) * 0.22) * window;
    glow = smoothstep(0.84, 1.0, ribbons) * window;
    color = mix(gold, pink, lum);
  } else if (uVariant < 5.5) {
    // Demo 6 — planetary rotated displacement. Spiral vortex.
    vec2 disp = vec2(noise(uv * 5.5 + uTime * 0.12), noise(uv * 5.5 + 4.2 - uTime * 0.10)) - 0.5;
    vec2 q = rot(PI * 0.25) * (p + disp * 0.44 * parabola(progress, 0.55));
    float ang = atan(q.y, q.x);
    float rr = length(q);
    float arms = sin(ang * 5.0 + rr * 18.0 - uTime * 1.8);
    float core = 1.0 - smoothstep(0.0, 0.42, rr);
    mask = (smoothstep(0.08, 0.92, arms) * 0.72 + core * 0.38) * parabola(progress, 0.58);
    glow = exp(-abs(arms) * 1.5) * parabola(progress, 0.85);
    color = mix(cyan, gold, rr + core * 0.35);
  } else if (uVariant < 6.5) {
    // Demo 7 — divided UV stripe displacement. Barcode shutter.
    vec2 divided = fract(uv * vec2(42.0, 1.0));
    float stripeCore = step(0.18, divided.x) * step(divided.x, 0.62);
    float diagonal = uv.x + uv.y * 0.18 + divided.x * 0.06;
    float sweep = smoothstep(-0.10, 1.12, progress * 1.32 - diagonal + 0.18);
    float shutter = stripeCore * sweep * smoothstep(0.04, 0.56, progress) * smoothstep(1.0, 0.78, progress);
    mask = shutter * 0.92;
    glow = stripeCore * exp(-pow(progress - uv.x, 2.0) * 30.0) * 0.86;
    color = mix(pink, cyan, divided.x);
  } else {
    // Demo 8 — noise push/pull. Vertical flow with directional pressure.
    float hn = noise(uv * uRes / 115.0 + uTime * 0.12);
    vec2 centerDir = normalize(vec2(0.5) - uv + 0.001);
    float pull = centerDir.y * (1.0 + hn * 0.7) * parabola(progress, 0.62);
    float bands = sin((uv.y + pull * 0.52) * 28.0 + hn * 5.0);
    float pressure = smoothstep(-0.22, 0.96, bands) * parabola(progress, 0.62);
    float verticalGlow = exp(-pow(uv.y - (0.5 + pull * 0.22), 2.0) * 18.0);
    mask = pressure * 0.78 + verticalGlow * 0.22;
    glow = verticalGlow * pressure;
    color = mix(mint, pink, hn);
  }

  gl_FragColor = paint(uv, mask, color, glow);
}
`

export const SDF_BLOB_FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uProgress;
uniform float uAlpha;
uniform float uVariant;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
#define PI 3.14159265359

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float circleSdf(vec2 p, vec2 c, float r){ return length(p - c) - r; }
float smin(float a, float b, float k){
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (uv - 0.5) * aspect;
  float progress = smoothstep(0.0, 1.0, uProgress);
  float grow = smoothstep(0.0, 0.86, progress);
  float exitFade = smoothstep(1.0, 0.72, progress);

  float wobble = noise(uv * 7.0 + uTime * 0.18) * 0.035;
  float ringNoise = noise(vec2(atan(p.y, p.x) * 2.0, uTime * 0.18)) * 0.075;
  float dCircle = circleSdf(p, vec2(0.0), 0.04 + grow * 0.64);
  float dWarped = circleSdf(p, vec2(0.0), 0.04 + grow * 0.62 + ringNoise * smoothstep(0.08, 0.96, progress));

  float m0 = circleSdf(p, vec2(-0.26, -0.08), 0.06 + grow * 0.42 + wobble);
  float m1 = circleSdf(p, vec2(0.24, 0.12), 0.06 + grow * 0.40 - wobble * 0.5);
  float dMerge = smin(m0, m1, 0.18);

  float angle = atan(p.y, p.x);
  float sector3 = 2.0 * PI / 3.0;
  float sector5 = 2.0 * PI / 5.0;
  float a3 = floor((angle + PI) / sector3 + 0.5) * sector3 - PI;
  float a5 = floor((angle + PI) / sector5 + 0.5) * sector5 - PI;
  float r0 = 0.17 + grow * 0.24;
  float r1 = 0.30 + grow * 0.18;
  float dR0 = circleSdf(p, vec2(cos(a3), sin(a3)) * r0, 0.04 + grow * 0.22 + wobble * 0.4);
  float dR1 = circleSdf(p, vec2(cos(a5), sin(a5)) * r1, 0.035 + grow * 0.18);
  float dRadial = smin(dR0, dR1, 0.14);

  float f0 = circleSdf(p, vec2(-0.28, -0.10), 0.08 + grow * 0.46 + wobble);
  float f1 = circleSdf(p, vec2(0.00, 0.16), 0.06 + grow * 0.42 - wobble * 0.5);
  float f2 = circleSdf(p, vec2(0.30, -0.06), 0.05 + grow * 0.40 + wobble * 0.6);
  float f3 = circleSdf(p, vec2(-0.02, -0.30), 0.04 + grow * 0.34);
  float dFinal = smin(smin(f0, f1, 0.18), smin(f2, f3, 0.16), 0.20);
  dFinal = smin(dFinal, dRadial, 0.16);

  float d = dFinal;
  if (uVariant < 0.5) {
    d = dCircle;
  } else if (uVariant < 1.5) {
    d = dWarped;
  } else if (uVariant < 2.5) {
    d = dMerge;
  } else if (uVariant < 3.5) {
    d = dRadial;
  }

  float edge = exp(-d * d * 160.0) * exitFade;
  float fill = smoothstep(0.08, -0.10, d) * smoothstep(0.0, 0.18, progress) * exitFade;
  float cell = hash(floor((uv + noise(uv * 11.0) * 0.01) * uRes / 7.0) + floor(uTime * 10.0));
  float flecks = step(0.78, cell) * edge * 0.22 * smoothstep(1.5, 4.0, uVariant);

  vec3 rose = uC0;
  vec3 apricot = uC2;
  vec3 mint = uC3;
  vec3 color = mix(rose, apricot, smoothstep(-0.35, 0.35, p.x + noise(uv * 5.0) * 0.18));
  color = mix(color, mint, smoothstep(0.12, 0.7, p.y + grow * 0.16));

  float alpha = (fill * 0.24 + edge * 0.72 + flecks) * uAlpha;
  gl_FragColor = vec4(color * alpha + vec3(1.0) * edge * 0.18 * uAlpha, clamp(alpha, 0.0, 0.9));
}
`

export const APERTURE_BLUR_FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uProgress;
uniform float uAlpha;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
#define PI 3.14159265359

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (uv - 0.5) * aspect;
  float r = length(p);
  float a = atan(p.y, p.x);

  float progress = smoothstep(0.0, 1.0, uProgress);
  float radius = mix(0.05, 0.82, progress);
  float apertureNoise = sin(a * 8.0 + uTime * 0.9) * 0.018 + sin(a * 17.0 - uTime * 0.6) * 0.006;
  float d = r - radius - apertureNoise;

  float exitFade = smoothstep(0.94, 0.58, progress);
  float ring = exp(-d * d * 210.0) * exitFade;
  float innerGlow = smoothstep(radius + 0.18, radius - 0.02, r) * smoothstep(0.0, 0.34, progress) * exitFade;
  float outerFeather = smoothstep(radius + 0.22, radius - 0.04, r) * exitFade * 0.55;
  float grain = hash(floor(uv * uRes / 3.0) + floor(uTime * 18.0)) * 0.045;

  vec3 champagne = uC2;
  vec3 rose = uC0;
  vec3 cyan = uC1;
  vec3 color = mix(champagne, rose, smoothstep(-0.4, 0.4, sin(a * 2.0 + uTime * 0.7)));
  color = mix(color, cyan, ring * 0.38 + smoothstep(0.74, 1.0, progress) * 0.18);

  float highlight = ring * (0.82 + grain) + innerGlow * 0.18 + outerFeather * 0.08;
  float alpha = clamp(highlight * uAlpha, 0.0, 0.88);
  gl_FragColor = vec4(color * alpha + vec3(1.0) * ring * 0.22 * uAlpha, alpha);
}
`

export const CHROMA_BLUR_FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uProgress;
uniform float uAlpha;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
#define PI 3.14159265359

float hash(vec2 p){ return fract(sin(dot(p, vec2(41.0, 289.0))) * 45758.5453); }
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float p = smoothstep(0.0, 1.0, uProgress);
  float field = uv.x * 0.62 + uv.y * 0.38;
  float n = noise(uv * 10.0 + vec2(uTime * 0.28, -uTime * 0.18));
  float wave = sin((uv.y + n * 0.12) * 28.0 + uTime * 2.2) * 0.018;
  float front = p * 1.42 - 0.2;
  float d = field + wave - front;

  float curtain = exp(-d * d * 34.0);
  float softGrain = noise(uv * 34.0 + uTime * 0.18) * 0.055;
  float chroma = exp(-(d + 0.045) * (d + 0.045) * 52.0) + exp(-(d - 0.045) * (d - 0.045) * 52.0);
  float exitFade = smoothstep(1.0, 0.74, p);
  float entryFade = smoothstep(0.0, 0.16, p);

  vec3 brandPink = uC0;
  vec3 champagne = uC2;
  vec3 seafoam = uC3;
  vec3 porcelain = vec3(1.0);
  vec3 color = mix(brandPink, champagne, smoothstep(-0.18, 0.18, sin((uv.y + n) * PI * 2.0)));
  color = mix(color, seafoam, smoothstep(0.2, 1.0, chroma) * 0.34);
  color = mix(color, porcelain, 0.16);

  float alpha = (curtain * 0.72 + chroma * 0.18 + softGrain * curtain) * entryFade * exitFade * uAlpha;
  gl_FragColor = vec4(color * alpha, clamp(alpha, 0.0, 0.86));
}
`
