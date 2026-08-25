import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PlatformIcon } from "../../components/social/PlatformIcon";
import { categoryLabel } from "../../entities/creator";
import type { SelectorSummary } from "../../entities/selectors";
import { assetUrl } from "../../lib/assetUrl";
import { formatNumber } from "../../lib/formatters";
import "../../styles/selector-pool.css";

const CATEGORY_RADIUS = 64;
const ORBIT_GAP = 26;
const DAMPING = 0.86;
const GOLDEN_ANGLE = 2.39996;
const INK = "17 24 39";
// 작은 버블은 색을 통일하고, 색 구분은 카테고리 쪽에서만 한다.
const NODE_TINT = "30 157 139"; // 브랜드 틸

interface PoolNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  orbit: number;
  categoryIndex: number;
  selector: SelectorSummary;
}

interface PoolCategory {
  label: string;
  x: number;
  y: number;
  count: number;
  /** 카테고리 색상. `rgb(r g b / a%)` 로 조합해 쓴다. */
  rgb: string;
}

// 한 계열(브랜드 틸)의 명도 차이로만 카테고리를 구분한다.
const CATEGORY_COLORS = [
  "30 157 139",
  "13 100 92",
  "116 201 190",
  "7 63 58",
];


// 백엔드 필드명이 확정 전이라 카테고리로 쓸 수 있는 키를 순서대로 훑는다.
const CATEGORY_KEYS = ["category", "categoryName", "categoryCode", "representativeCategory"];

function rawCategory(selector: SelectorSummary) {
  const record = selector as unknown as Record<string, unknown>;
  for (const key of CATEGORY_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function categoryOf(selector: SelectorSummary) {
  const raw = rawCategory(selector);
  return (raw ? categoryLabel(raw) : null) || "미분류";
}

/** 프로필 이미지가 없을 때 쓰는 계정 아이디 첫 글자. */
function initialOf(selector: SelectorSummary) {
  const source = selector.snsAccountId || selector.snsDisplayName || selector.nickname || "?";
  return source.slice(0, 1).toUpperCase();
}

function nodeRadius(followerCount: number | null) {
  return 26 + Math.min(20, Math.log10((followerCount ?? 0) + 1) * 4);
}

/** 카테고리 중심을 큰 원 하나 위에 고르게 배치한다. */
function layoutCategories(counts: Map<string, number>): PoolCategory[] {
  const entries = [...counts.entries()];
  // 각 클러스터가 차지하는 반지름을 먼저 재고, 서로 닿지 않을 만큼 큰 원을 잡는다.
  const clusterReach = Math.max(
    ...entries.map(([, count]) => clusterRadius(count)),
    CATEGORY_RADIUS * 2,
  );
  const ring = entries.length < 2
    ? 0
    : Math.max(320, (clusterReach * 2.3 * entries.length) / (2 * Math.PI));

  return entries.map(([label, count], index) => {
    const angle = (index / entries.length) * Math.PI * 2 - Math.PI / 2;
    return {
      label,
      count,
      rgb: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      x: Math.cos(angle) * ring,
      y: Math.sin(angle) * ring,
    };
  });
}

/** 카테고리 하나가 차지하는 반지름(가장 바깥 궤도까지). */
function clusterRadius(count: number) {
  return CATEGORY_RADIUS + ORBIT_GAP + Math.max(0, Math.ceil(count / 8) - 1) * 96 + 46;
}

function buildNodes(selectors: SelectorSummary[], categories: PoolCategory[]) {
  const indexByLabel = new Map(categories.map((category, index) => [category.label, index]));
  const seats = new Map<number, number>();

  return selectors.map((selector) => {
    const categoryIndex = indexByLabel.get(categoryOf(selector)) ?? 0;
    const seat = seats.get(categoryIndex) ?? 0;
    seats.set(categoryIndex, seat + 1);
    const category = categories[categoryIndex];
    const angle = seat * GOLDEN_ANGLE;
    const orbit = CATEGORY_RADIUS + ORBIT_GAP + Math.floor(seat / 8) * 96 + 46;
    return {
      x: category.x + Math.cos(angle) * orbit,
      y: category.y + Math.sin(angle) * orbit,
      vx: 0,
      vy: 0,
      r: nodeRadius(selector.followerCount),
      phase: ((selector.id % 100) / 100) * Math.PI * 2,
      orbit,
      categoryIndex,
      selector,
    } satisfies PoolNode;
  });
}

function loadImages(nodes: PoolNode[]) {
  const images = new Map<number, HTMLImageElement>();
  nodes.forEach((node) => {
    const source = assetUrl(node.selector.profileImageUrl ?? "");
    if (!source) return;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => images.set(node.selector.id, image);
    image.src = source;
  });
  return images;
}

/** ponytail: O(n^2) 반발력. 노드가 수백 개를 넘어가면 공간 해싱으로 교체. */
function step(nodes: PoolNode[], categories: PoolCategory[]) {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const category = categories[node.categoryIndex];
    const dx = node.x - category.x;
    const dy = node.y - category.y;
    const distance = Math.hypot(dx, dy) || 0.001;
    const pull = (distance - node.orbit) * 0.004;
    node.vx -= (dx / distance) * pull;
    node.vy -= (dy / distance) * pull;

    for (let other = index + 1; other < nodes.length; other += 1) {
      const peer = nodes[other];
      const px = peer.x - node.x;
      const py = peer.y - node.y;
      const gap = Math.hypot(px, py) || 0.001;
      const minimum = node.r + peer.r + 12;
      if (gap >= minimum) continue;
      const push = ((minimum - gap) / minimum) * 0.9;
      node.vx -= (px / gap) * push;
      node.vy -= (py / gap) * push;
      peer.vx += (px / gap) * push;
      peer.vy += (py / gap) * push;
    }
  }

  nodes.forEach((node) => {
    node.vx *= DAMPING;
    node.vy *= DAMPING;
    node.x += node.vx;
    node.y += node.vy;
  });
}

/** 살짝 휜 유기적인 연결선. */
function drawCurve(
  context: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const bend = 0.12;
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.quadraticCurveTo(
    midX - (toY - fromY) * bend,
    midY + (toX - fromX) * bend,
    toX,
    toY,
  );
  context.stroke();
}

function drawBubble(
  context: CanvasRenderingContext2D,
  node: PoolNode,
  x: number,
  y: number,
  radius: number,
  image: HTMLImageElement | undefined,
  tint: string,
) {
  // 흰 배경에서 떠 보이도록 부드러운 그림자 위에 흰 테를 깐다.
  context.save();
  context.shadowColor = `rgb(${INK} / 22%)`;
  context.shadowBlur = 14;
  context.shadowOffsetY = 5;
  context.fillStyle = "#fff";
  context.beginPath();
  context.arc(x, y, radius + 2.5, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.save();
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.clip();
  if (image) {
    context.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
  } else {
    const blob = context.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    blob.addColorStop(0, `rgb(${tint} / 92%)`);
    blob.addColorStop(1, `rgb(${tint} / 62%)`);
    context.fillStyle = blob;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    context.fillStyle = "#fff";
    context.font = `700 ${Math.round(radius)}px Pretendard, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(initialOf(node.selector), x, y);
  }
  context.restore();
}

/** 프로필 이미지가 없거나 깨지면 계정 아이디 첫 글자를 보여준다. */
function PoolAvatar({ selector }: { selector: SelectorSummary }) {
  const [failed, setFailed] = useState(false);
  const source = assetUrl(selector.profileImageUrl ?? "");

  return (
    <span className="hsas-selector-pool__dock-photo">
      {source && !failed ? (
        <img
          alt={`${selector.nickname} 프로필 이미지`}
          onError={() => setFailed(true)}
          src={source}
        />
      ) : (
        <span aria-hidden="true">{initialOf(selector)}</span>
      )}
    </span>
  );
}

export interface SelectorPoolCanvasProps {
  onSelect: (selector: SelectorSummary) => void;
  selectors: SelectorSummary[];
}

export function SelectorPoolCanvas({ onSelect, selectors }: SelectorPoolCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectRef = useRef(onSelect);
  const focusRef = useRef<string | null>(null);
  const cameraRef = useRef<((label: string | null) => void) | null>(null);
  const spotlightRef = useRef<((selectorId: number | null) => void) | null>(null);
  // 도크를 훑는 동안에는 목록을 고정한다(화면이 움직여 목록이 바뀌는 되먹임 방지).
  const dockHoverRef = useRef(false);
  const [visible, setVisible] = useState<SelectorSummary[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    selectors.forEach((selector) => {
      const label = categoryOf(selector);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return layoutCategories(counts);
  }, [selectors]);
  const [dockOpen, setDockOpen] = useState(false);

  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    if (import.meta.env.DEV && selectors.length && !rawCategory(selectors[0])) {
      console.warn(`[selector-pool] 목록 응답에 카테고리 필드가 없습니다. 응답 키: ${Object.keys(selectors[0]).join(", ")}`);
    }
    if (!categories.length) return;
    const nodes = buildNodes(selectors, categories);
    const images = loadImages(nodes);

    // view 는 지금 보이는 화면, camera 는 목표값. 매 프레임 부드럽게 따라간다.
    const view = { x: 0, y: 0, scale: 0.8 };
    const camera = { x: 0, y: 0, scale: 0.8 };
    const pointer = { x: 0, y: 0 };
    let hovered: PoolNode | null = null;
    let spotlight: PoolNode | null = null;
    let dragging = false;
    let moved = 0;
    let frame = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const top = canvas.parentElement?.getBoundingClientRect().top ?? 0;
      canvas.parentElement?.style.setProperty("--hsas-pool-top", `${Math.round(top)}px`);
      const box = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(box.width * ratio));
      canvas.height = Math.max(1, Math.round(box.height * ratio));
    };
    resize();

    const fitAll = () => {
      const box = canvas.getBoundingClientRect();
      const reach = Math.max(
        ...nodes.map((node) => Math.hypot(node.x, node.y) + node.r),
        CATEGORY_RADIUS * 3,
      );
      camera.scale = Math.min(1.4, Math.max(0.3, Math.min(box.width, box.height) / (reach * 1.5)));
      camera.x = box.width / 2;
      camera.y = box.height / 2;
    };
    fitAll();
    view.x = camera.x;
    view.y = camera.y;
    view.scale = camera.scale;

    // 카테고리 칩을 누르면 해당 클러스터로 카메라가 이동한다.
    cameraRef.current = (label) => {
      focusRef.current = label;
      if (!label) {
        fitAll();
        return;
      }
      const category = categories.find((item) => item.label === label);
      if (!category) return;
      const members = nodes.filter((node) => categories[node.categoryIndex].label === label);
      const box = canvas.getBoundingClientRect();
      const reach = Math.max(
        ...members.map((node) => Math.hypot(node.x - category.x, node.y - category.y) + node.r),
        CATEGORY_RADIUS * 2,
      );
      camera.scale = Math.min(1.8, Math.max(0.4, Math.min(box.width, box.height) / (reach * 2.4)));
      camera.x = box.width / 2 - category.x * camera.scale;
      camera.y = box.height / 2 - category.y * camera.scale;
    };

    spotlightRef.current = (id) => {
      spotlight = id == null ? null : nodes.find((node) => node.selector.id === id) ?? null;
      if (!spotlight) return;
      const box = canvas.getBoundingClientRect();
      camera.x = box.width / 2 - spotlight.x * camera.scale;
      camera.y = box.height / 2 - spotlight.y * camera.scale;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);

    const toWorld = (clientX: number, clientY: number) => {
      const box = canvas.getBoundingClientRect();
      return {
        x: (clientX - box.left - view.x) / view.scale,
        y: (clientY - box.top - view.y) / view.scale,
      };
    };

    const hitTest = (worldX: number, worldY: number) => (
      nodes.find((node) => (
        (!focusRef.current || categories[node.categoryIndex].label === focusRef.current)
        && Math.hypot(node.x - worldX, node.y - worldY) <= node.r + 4
      )) ?? null
    );

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      moved = 0;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragging) {
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        moved += Math.abs(dx) + Math.abs(dy);
        view.x += dx;
        view.y += dy;
        camera.x = view.x;
        camera.y = view.y;
      }
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      const world = toWorld(event.clientX, event.clientY);
      hovered = dragging ? null : hitTest(world.x, world.y);
      canvas.style.cursor = dragging ? "grabbing" : hovered ? "pointer" : "grab";
    };
    const onPointerUp = (event: PointerEvent) => {
      if (dragging && moved < 5) {
        const world = toWorld(event.clientX, event.clientY);
        const picked = hitTest(world.x, world.y);
        if (picked) selectRef.current(picked.selector);
      }
      dragging = false;
      canvas.releasePointerCapture(event.pointerId);
    };
    const onPointerLeave = () => {
      hovered = null;
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const box = canvas.getBoundingClientRect();
      const cursorX = event.clientX - box.left;
      const cursorY = event.clientY - box.top;
      const next = Math.min(2.4, Math.max(0.2, camera.scale * (event.deltaY < 0 ? 1.12 : 1 / 1.12)));
      camera.x = cursorX - (cursorX - camera.x) * (next / camera.scale);
      camera.y = cursorY - (cursorY - camera.y) * (next / camera.scale);
      camera.scale = next;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const floatOf = (node: PoolNode, time: number) => ({
      x: node.x + Math.sin(time / 1400 + node.phase) * 5,
      y: node.y + Math.cos(time / 1700 + node.phase) * 5,
    });

    let visibleKey = "";
    let visibleCheckedAt = 0;
    /** 화면 안에 들어온 버블만 골라 왼쪽 목록에 넘긴다(초당 4회, 목록이 바뀔 때만 리렌더). */
    const syncVisible = (time: number, width: number, height: number) => {
      if (dockHoverRef.current || time - visibleCheckedAt < 250) return;
      visibleCheckedAt = time;
      const inView = nodes.filter((node) => {
        if (focusRef.current && categories[node.categoryIndex].label !== focusRef.current) return false;
        const screenX = node.x * view.scale + view.x;
        const screenY = node.y * view.scale + view.y;
        const radius = node.r * view.scale;
        return screenX + radius > 0 && screenX - radius < width
          && screenY + radius > 0 && screenY - radius < height;
      }).map((node) => node.selector);
      const key = inView.map((selector) => selector.id).join(",");
      if (key === visibleKey) return;
      visibleKey = key;
      setVisible(inView);
    };

    const render = (time: number) => {
      frame = requestAnimationFrame(render);
      step(nodes, categories);

      view.x += (camera.x - view.x) * 0.12;
      view.y += (camera.y - view.y) * 0.12;
      view.scale += (camera.scale - view.scale) * 0.12;

      const ratio = window.devicePixelRatio || 1;
      const width = canvas.width / ratio;
      const height = canvas.height / ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const backdrop = context.createLinearGradient(0, 0, 0, height);
      backdrop.addColorStop(0, "#fff");
      backdrop.addColorStop(1, "#f3f5f8");
      context.fillStyle = backdrop;
      context.fillRect(0, 0, width, height);
      syncVisible(time, width, height);
      context.translate(view.x, view.y);
      context.scale(view.scale, view.scale);

      const focused = focusRef.current;
      const lit = hovered ?? spotlight;
      const weightOf = (categoryIndex: number) => (
        !focused || categories[categoryIndex].label === focused ? 1 : 0.12
      );

      // 카테고리를 꿰는 큰 원 하나
      const ringRadius = Math.hypot(categories[0].x, categories[0].y);
      if (ringRadius > 0) {
        context.save();
        context.strokeStyle = `rgb(${INK} / 10%)`;
        context.lineWidth = 1.2;
        context.setLineDash([2, 10]);
        context.beginPath();
        context.arc(0, 0, ringRadius, 0, Math.PI * 2);
        context.stroke();
        context.restore();

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = `rgb(${INK} / 38%)`;
        context.font = "700 26px Pretendard, sans-serif";
        context.fillText("셀렉터스 풀", 0, -26);
        context.fillStyle = `rgb(${INK} / 70%)`;
        context.font = "800 52px Pretendard, sans-serif";
        context.fillText(String(nodes.length), 0, 18);
      }

      // 클러스터마다 옅은 색 안개를 깔아 영역이 구분되게 한다.
      categories.forEach((category, categoryIndex) => {
        const spread = CATEGORY_RADIUS * 5.5;
        const wash = context.createRadialGradient(
          category.x, category.y, 0,
          category.x, category.y, spread,
        );
        wash.addColorStop(0, `rgb(${category.rgb} / ${12 * weightOf(categoryIndex)}%)`);
        wash.addColorStop(1, `rgb(${category.rgb} / 0%)`);
        context.fillStyle = wash;
        context.beginPath();
        context.arc(category.x, category.y, spread, 0, Math.PI * 2);
        context.fill();
      });

      context.lineWidth = 0.9;
      nodes.forEach((node, index) => {
        const category = categories[node.categoryIndex];
        const weight = weightOf(node.categoryIndex);
        const position = floatOf(node, time);
        const near = lit === node || lit?.categoryIndex === node.categoryIndex;
        context.strokeStyle = `rgb(${category.rgb} / ${(near ? 55 : 22) * weight}%)`;
        drawCurve(context, category.x, category.y, position.x, position.y);

        const sibling = nodes[index + 1];
        if (sibling && sibling.categoryIndex === node.categoryIndex) {
          const siblingPosition = floatOf(sibling, time);
          context.strokeStyle = `rgb(${category.rgb} / ${14 * weight}%)`;
          drawCurve(context, position.x, position.y, siblingPosition.x, siblingPosition.y);
        }
      });

      categories.forEach((category, categoryIndex) => {
        const pulse = 1 + Math.sin(time / 1800 + categoryIndex) * 0.02;
        const core = CATEGORY_RADIUS * pulse;

        context.save();
        context.globalAlpha = weightOf(categoryIndex);

        // 은은한 후광
        const glow = context.createRadialGradient(
          category.x, category.y, core * 0.4,
          category.x, category.y, core * 2.2,
        );
        glow.addColorStop(0, `rgb(${category.rgb} / 22%)`);
        glow.addColorStop(1, `rgb(${category.rgb} / 0%)`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(category.x, category.y, core * 2.2, 0, Math.PI * 2);
        context.fill();

        // 천천히 도는 점선 궤도
        context.save();
        context.translate(category.x, category.y);
        context.rotate(time / 11000 + categoryIndex);
        context.strokeStyle = `rgb(${category.rgb} / 32%)`;
        context.lineWidth = 1;
        context.setLineDash([9, 13]);
        context.beginPath();
        context.arc(0, 0, core * 1.55, 0, Math.PI * 2);
        context.stroke();
        context.restore();

        // 흰 코어 + 색 링
        context.save();
        context.shadowColor = `rgb(${category.rgb} / 40%)`;
        context.shadowBlur = 24;
        context.shadowOffsetY = 6;
        context.fillStyle = "#fff";
        context.beginPath();
        context.arc(category.x, category.y, core, 0, Math.PI * 2);
        context.fill();
        context.restore();

        context.strokeStyle = `rgb(${category.rgb})`;
        context.lineWidth = 3;
        context.beginPath();
        context.arc(category.x, category.y, core - 1.5, 0, Math.PI * 2);
        context.stroke();

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = `rgb(${INK})`;
        context.font = "700 15px Pretendard, sans-serif";
        context.fillText(category.label, category.x, category.y - 6);

        context.font = "600 11px Pretendard, sans-serif";
        const countLabel = `${category.count}명`;
        const chipWidth = context.measureText(countLabel).width + 16;
        context.fillStyle = `rgb(${category.rgb} / 16%)`;
        context.beginPath();
        context.roundRect(category.x - chipWidth / 2, category.y + 6, chipWidth, 17, 9);
        context.fill();
        context.fillStyle = `rgb(${category.rgb})`;
        context.fillText(countLabel, category.x, category.y + 15);
        context.restore();
      });

      nodes.forEach((node) => {
        const position = floatOf(node, time);
        const active = lit === node;
        const radius = node.r * (active ? 1.22 : 1);

        context.save();
        context.globalAlpha = weightOf(node.categoryIndex);

        if (active) {
          context.strokeStyle = `rgb(${NODE_TINT} / 45%)`;
          context.lineWidth = 2;
          context.beginPath();
          context.arc(position.x, position.y, radius + 8 + Math.sin(time / 240) * 3, 0, Math.PI * 2);
          context.stroke();
        }

        drawBubble(context, node, position.x, position.y, radius, images.get(node.selector.id), NODE_TINT);

        context.strokeStyle = active ? `rgb(${NODE_TINT})` : `rgb(${INK} / 12%)`;
        context.lineWidth = active ? 2.6 : 1.6;
        context.beginPath();
        context.arc(position.x, position.y, radius + 1, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      });

      // 호버한 버블의 정보 카드는 항상 맨 위에 그린다.
      if (lit) {
        const position = floatOf(lit, time);
        const radius = lit.r * 1.22;
        const name = lit.selector.snsDisplayName || lit.selector.nickname;
        const account = lit.selector.snsAccountId || "-";
        const followers = lit.selector.followerCount == null
          ? null
          : `팔로워 ${formatNumber(lit.selector.followerCount)}`;

        context.font = "700 12px Pretendard, sans-serif";
        const nameWidth = context.measureText(name).width;
        context.font = "500 11px Pretendard, sans-serif";
        const metaWidth = Math.max(
          context.measureText(account).width,
          followers ? context.measureText(followers).width : 0,
        );
        const cardWidth = Math.max(nameWidth, metaWidth) + 26;
        const cardHeight = followers ? 60 : 44;
        const cardY = position.y + radius + 10;

        context.save();
        context.shadowColor = `rgb(${INK} / 22%)`;
        context.shadowBlur = 18;
        context.shadowOffsetY = 6;
        context.fillStyle = "#fff";
        context.beginPath();
        context.roundRect(position.x - cardWidth / 2, cardY, cardWidth, cardHeight, 12);
        context.fill();
        context.restore();

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = `rgb(${INK})`;
        context.font = "700 12px Pretendard, sans-serif";
        context.fillText(name, position.x, cardY + 16);
        context.fillStyle = `rgb(${INK} / 60%)`;
        context.font = "500 11px Pretendard, sans-serif";
        context.fillText(account, position.x, cardY + 32);
        if (followers) context.fillText(followers, position.x, cardY + 48);
      }
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      cameraRef.current = null;
      spotlightRef.current = null;
      observer.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [categories, selectors]);

  const focusCategory = (label: string | null) => {
    setFocus(label);
    cameraRef.current?.(label);
  };

  return (
    <div className="hsas-selector-pool">
      <canvas
        aria-label="셀렉터스 발견 풀"
        className="hsas-selector-pool__canvas"
        ref={canvasRef}
        role="img"
      />
      <div className="hsas-selector-pool__legend">
        <button
          aria-pressed={focus === null}
          className="hsas-selector-pool__chip"
          onClick={() => focusCategory(null)}
          type="button"
        >
          전체 보기
        </button>
        {categories.map((category) => (
          <button
            aria-pressed={focus === category.label}
            className="hsas-selector-pool__chip"
            key={category.label}
            onClick={() => focusCategory(focus === category.label ? null : category.label)}
            style={{ "--hsas-pool-chip": `rgb(${category.rgb})` } as CSSProperties}
            type="button"
          >
            <span aria-hidden="true" className="hsas-selector-pool__chip-dot" />
            {category.label}
            <em>{category.count}</em>
          </button>
        ))}
      </div>
      <aside
        aria-label="현재 화면의 셀렉터스"
        className={`hsas-selector-pool__dock${dockOpen ? "" : " is-collapsed"}`}
        onBlurCapture={() => { dockHoverRef.current = false; }}
        onFocusCapture={() => { dockHoverRef.current = true; }}
        onMouseEnter={() => { dockHoverRef.current = true; }}
        onMouseLeave={() => { dockHoverRef.current = false; }}
      >
        <button
          aria-expanded={dockOpen}
          className="hsas-selector-pool__dock-toggle"
          onClick={() => setDockOpen((open) => !open)}
          type="button"
        >
          <span>{dockOpen ? `화면 속 셀렉터스 ${visible.length}` : "셀렉터스 목록 보기"}</span>
          <span aria-hidden="true">{dockOpen ? "˄" : "˅"}</span>
        </button>
        <div className="hsas-selector-pool__dock-viewport">
          <ul className="hsas-selector-pool__dock-list">
            {visible.map((selector) => (
              <li key={selector.id}>
                <button
                  className="hsas-selector-pool__dock-item"
                  onBlur={() => spotlightRef.current?.(null)}
                  onClick={() => onSelect(selector)}
                  onFocus={() => spotlightRef.current?.(selector.id)}
                  onMouseEnter={() => spotlightRef.current?.(selector.id)}
                  onMouseLeave={() => spotlightRef.current?.(null)}
                  type="button"
                >
                  <PoolAvatar selector={selector} />
                  <span className="hsas-selector-pool__dock-text">
                    <strong>{selector.nickname}</strong>
                    <span>
                      {selector.snsCode ? (
                        <PlatformIcon
                          decorative
                          platform={selector.snsCode === "YOUTUBE" ? "YouTube" : "Instagram"}
                        />
                      ) : null}
                      {selector.snsDisplayName || selector.snsAccountId || "-"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
