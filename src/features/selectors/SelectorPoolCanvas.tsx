import { useEffect, useMemo, useRef, useState } from "react";
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
}


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

/** 24x24 뷰박스 기준 플랫폼 로고(PlatformIcon 과 같은 패스). */
const PLATFORM_MARK = {
  INSTAGRAM: {
    color: "225 48 108",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.668-.072-4.948-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z",
  },
  YOUTUBE: {
    color: "255 0 0",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.121-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z",
  },
} as const;

const platformPaths = new Map<keyof typeof PLATFORM_MARK, Path2D>();

function platformMark(snsCode: SelectorSummary["snsCode"]) {
  const key = snsCode === "YOUTUBE" ? "YOUTUBE" : "INSTAGRAM";
  let path = platformPaths.get(key);
  if (!path) {
    path = new Path2D(PLATFORM_MARK[key].path);
    platformPaths.set(key, path);
  }
  return { color: PLATFORM_MARK[key].color, path };
}

function drawBubble(
  context: CanvasRenderingContext2D,
  node: PoolNode,
  x: number,
  y: number,
  radius: number,
  image: HTMLImageElement | undefined,
  active: boolean,
) {
  const padding = Math.max(4, radius * 0.14);
  const rotation = Math.sin(node.phase) * 0.18;

  // 프로필 바깥쪽만 얇고 비대칭인 투명 유리 패딩으로 감싼다.
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.shadowColor = `rgb(${INK} / ${active ? 18 : 9}%)`;
  context.shadowBlur = active ? 16 : 10;
  context.shadowOffsetY = active ? 5 : 3;
  const glass = context.createLinearGradient(-radius, -radius, radius, radius);
  glass.addColorStop(0, active ? `rgb(${INK} / 15%)` : "rgb(255 255 255 / 88%)");
  glass.addColorStop(0.55, active ? `rgb(${INK} / 9%)` : "rgb(255 255 255 / 42%)");
  glass.addColorStop(1, active ? `rgb(${INK} / 18%)` : `rgb(${INK} / 7%)`);
  context.fillStyle = glass;
  context.beginPath();
  context.ellipse(0, 0, radius + padding, radius + padding * 0.72, 0, 0, Math.PI * 2);
  context.fill();

  context.shadowColor = "transparent";
  context.fillStyle = "rgb(255 255 255 / 72%)";
  context.beginPath();
  context.ellipse(-radius * 0.5, -radius * 0.68, padding * 0.65, padding * 0.28, -0.35, 0, Math.PI * 2);
  context.fill();
  context.restore();

  // 사진 자체에는 유리 효과를 씌우지 않는다.
  context.save();
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.clip();
  if (image) {
    context.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
  } else {
    const blob = context.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    blob.addColorStop(0, `rgb(${INK} / 88%)`);
    blob.addColorStop(1, `rgb(${INK} / 58%)`);
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
  /** 마우스를 올린 셀렉터스 상세를 미리 받아 두라는 신호. */
  onPrefetch?: (selector: SelectorSummary) => void;
  onSelect: (selector: SelectorSummary) => void;
  selectors: SelectorSummary[];
}

export function SelectorPoolCanvas({ onPrefetch, onSelect, selectors }: SelectorPoolCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectRef = useRef(onSelect);
  const prefetchRef = useRef(onPrefetch);
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
    prefetchRef.current = onPrefetch;
  }, [onPrefetch, onSelect]);

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
      const nextHovered = dragging ? null : hitTest(world.x, world.y);
      if (nextHovered && nextHovered !== hovered) prefetchRef.current?.(nextHovered.selector);
      hovered = nextHovered;
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

      categories.forEach((category, categoryIndex) => {
        const weight = weightOf(categoryIndex);
        context.save();
        context.globalAlpha = weight;
        context.filter = "blur(14px)";
        context.fillStyle = `rgb(${INK} / 9%)`;
        context.beginPath();
        context.ellipse(category.x, category.y, 70, 30, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();

        context.save();
        context.globalAlpha = weight;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = `rgb(${INK} / 82%)`;
        context.font = "700 15px Pretendard, sans-serif";
        context.fillText(category.label, category.x, category.y - 5);

        context.font = "600 11px Pretendard, sans-serif";
        context.fillStyle = `rgb(${INK} / 42%)`;
        context.fillText(`${category.count}명`, category.x, category.y + 14);
        context.restore();
      });

      nodes.forEach((node) => {
        const position = floatOf(node, time);
        const active = lit === node;
        const radius = node.r * (active ? 1.22 : 1);

        context.save();
        context.globalAlpha = weightOf(node.categoryIndex);

        drawBubble(context, node, position.x, position.y, radius, images.get(node.selector.id), active);
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

        const mark = platformMark(lit.selector.snsCode);

        context.font = "700 12px Pretendard, sans-serif";
        const nameWidth = context.measureText(name).width;
        context.font = "500 11px Pretendard, sans-serif";
        const accountWidth = context.measureText(account).width + 18; // 로고 자리
        const metaWidth = Math.max(
          accountWidth,
          followers ? context.measureText(followers).width : 0,
        );
        const cardWidth = Math.max(nameWidth, metaWidth) + 28;
        const cardHeight = followers ? 62 : 46;
        const cardY = position.y + radius + 10;

        // 흰 배경에 묻히지 않도록 어두운 카드 + 밝은 글자
        context.save();
        context.shadowColor = `rgb(${INK} / 30%)`;
        context.shadowBlur = 18;
        context.shadowOffsetY = 6;
        context.fillStyle = `rgb(${INK} / 94%)`;
        context.beginPath();
        context.roundRect(position.x - cardWidth / 2, cardY, cardWidth, cardHeight, 12);
        context.fill();
        context.restore();

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#fff";
        context.font = "700 12px Pretendard, sans-serif";
        context.fillText(name, position.x, cardY + 17);

        context.font = "500 11px Pretendard, sans-serif";
        const accountTextWidth = context.measureText(account).width;
        const accountLeft = position.x - accountTextWidth / 2;
        context.save();
        context.translate(accountLeft - 16, cardY + 27);
        context.scale(12 / 24, 12 / 24);
        context.fillStyle = `rgb(${mark.color})`;
        context.fill(mark.path);
        context.restore();
        context.fillStyle = "rgb(255 255 255 / 78%)";
        context.fillText(account, position.x, cardY + 33);
        if (followers) context.fillText(followers, position.x, cardY + 50);
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
            type="button"
          >
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
                  onFocus={() => {
                    spotlightRef.current?.(selector.id);
                    onPrefetch?.(selector);
                  }}
                  onMouseEnter={() => {
                    spotlightRef.current?.(selector.id);
                    onPrefetch?.(selector);
                  }}
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
